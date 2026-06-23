import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../supabaseClient.js'
import Topbar from '../components/Topbar.jsx'

const emptyForm = {
  course_name: '',
  tuition_fee: '',
  exam_fee: '',
  book_fee: '',
}

function formatRupees(value) {
  const num = Number(value) || 0
  return '₹' + num.toLocaleString('en-IN')
}

export default function CoursesList() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchCourses() {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setCourses(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  function openAddForm() {
    setForm(emptyForm)
    setEditingId(null)
    setFormErrors({})
    setServerError('')
    setShowForm(true)
  }

  function openEditForm(course) {
    setForm({
      course_name: course.course_name,
      tuition_fee: course.tuition_fee,
      exam_fee: course.exam_fee,
      book_fee: course.book_fee,
    })
    setEditingId(course.id)
    setFormErrors({})
    setServerError('')
    setShowForm(true)
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validate() {
    const next = {}
    if (!form.course_name.trim()) next.course_name = 'Course name is required'
    ;['tuition_fee', 'exam_fee', 'book_fee'].forEach((field) => {
      if (form[field] === '' || form[field] === null) {
        next[field] = 'Required'
      } else if (Number(form[field]) < 0) {
        next[field] = 'Must be 0 or more'
      }
    })
    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setSaving(true)
    const payload = {
      course_name: form.course_name.trim(),
      tuition_fee: Number(form.tuition_fee),
      exam_fee: Number(form.exam_fee),
      book_fee: Number(form.book_fee),
    }

    let error
    if (editingId) {
      ;({ error } = await supabase
        .from('courses')
        .update(payload)
        .eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('courses').insert(payload))
    }

    setSaving(false)

    if (error) {
      setServerError(error.message)
    } else {
      setShowForm(false)
      fetchCourses()
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', deleteTarget.id)

    setDeleting(false)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  return (
    <>
      <Topbar title="Courses & Fee Structure" />
      <div className="page-content">
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 16,
          }}
        >
          <button type="button" className="btn btn-primary" onClick={openAddForm}>
            <Plus size={16} /> Add Course
          </button>
        </div>

        {error && <div className="banner-error">{error}</div>}

        <div className="card">
          {loading ? (
            <div className="loading-state">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="empty-state">No courses found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Tuition Fee (Monthly)</th>
                  <th>Exam Fee (Term)</th>
                  <th>Book Fee (One Time)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td>{c.course_name}</td>
                    <td>{formatRupees(c.tuition_fee)}</td>
                    <td>{formatRupees(c.exam_fee)}</td>
                    <td>{formatRupees(c.book_fee)}</td>
                    <td>
                      <div className="action-icons">
                        <button title="Edit" onClick={() => openEditForm(c)}>
                          <Pencil size={16} />
                        </button>
                        <button
                          title="Delete"
                          className="icon-delete"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div
            className="modal-box"
            style={{ width: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingId ? 'Edit Course' : 'Add Course'}</h2>

            {serverError && <div className="banner-error">{serverError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Course Name</label>
                <input
                  value={form.course_name}
                  onChange={(e) => update('course_name', e.target.value)}
                  placeholder="e.g. Hifz"
                />
                {formErrors.course_name && (
                  <span className="form-error">{formErrors.course_name}</span>
                )}
              </div>

              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Tuition Fee (Monthly)</label>
                <input
                  type="number"
                  min="0"
                  value={form.tuition_fee}
                  onChange={(e) => update('tuition_fee', e.target.value)}
                  placeholder="e.g. 1500"
                />
                {formErrors.tuition_fee && (
                  <span className="form-error">{formErrors.tuition_fee}</span>
                )}
              </div>

              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Exam Fee (Term)</label>
                <input
                  type="number"
                  min="0"
                  value={form.exam_fee}
                  onChange={(e) => update('exam_fee', e.target.value)}
                  placeholder="e.g. 500"
                />
                {formErrors.exam_fee && (
                  <span className="form-error">{formErrors.exam_fee}</span>
                )}
              </div>

              <div className="form-field" style={{ marginBottom: 8 }}>
                <label>Book Fee (One Time)</label>
                <input
                  type="number"
                  min="0"
                  value={form.book_fee}
                  onChange={(e) => update('book_fee', e.target.value)}
                  placeholder="e.g. 2000"
                />
                {formErrors.book_fee && (
                  <span className="form-error">{formErrors.book_fee}</span>
                )}
              </div>

              <div className="modal-actions" style={{ gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Delete course?</h2>
            <p style={{ fontSize: 14, color: '#6b7184' }}>
              This will permanently delete{' '}
              <strong>{deleteTarget.course_name}</strong>. This action cannot
              be undone.
            </p>
            <div
              className="modal-actions"
              style={{ justifyContent: 'flex-end', gap: 12 }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirmed}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
