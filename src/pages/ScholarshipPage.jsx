import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../supabaseClient.js'
import Topbar from '../components/Topbar.jsx'

const emptyForm = {
  category_letter: '',
  category_name: '',
  discount_percentage: '',
  description: '',
}

// Fixed badge colors per letter, matching the mockup.
// Any letter outside A/B/C falls back to gray.
const BADGE_COLORS = {
  A: { bg: '#dcfce7', text: '#15803d' },
  B: { bg: '#fef3c7', text: '#b45309' },
  C: { bg: '#dbeafe', text: '#1d4ed8' },
}
const DEFAULT_BADGE = { bg: '#e5e7eb', text: '#374151' }

function getBadgeColor(letter) {
  return BADGE_COLORS[letter?.toUpperCase()] || DEFAULT_BADGE
}

export default function ScholarshipPage() {
  const [categories, setCategories] = useState([])
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

  async function fetchCategories() {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await supabase
      .from('scholarship_categories')
      .select('*')
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  function openAddForm() {
    setForm(emptyForm)
    setEditingId(null)
    setFormErrors({})
    setServerError('')
    setShowForm(true)
  }

  function openEditForm(cat) {
    setForm({
      category_letter: cat.category_letter,
      category_name: cat.category_name,
      discount_percentage: cat.discount_percentage,
      description: cat.description || '',
    })
    setEditingId(cat.id)
    setFormErrors({})
    setServerError('')
    setShowForm(true)
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validate() {
    const next = {}
    if (!form.category_letter.trim()) next.category_letter = 'Required'
    else if (form.category_letter.trim().length > 2)
      next.category_letter = 'Keep it short, e.g. A'
    if (!form.category_name.trim()) next.category_name = 'Required'
    if (form.discount_percentage === '' || form.discount_percentage === null) {
      next.discount_percentage = 'Required'
    } else if (
      Number(form.discount_percentage) < 0 ||
      Number(form.discount_percentage) > 100
    ) {
      next.discount_percentage = 'Must be between 0 and 100'
    }
    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setSaving(true)
    const payload = {
      category_letter: form.category_letter.trim().toUpperCase(),
      category_name: form.category_name.trim(),
      discount_percentage: Number(form.discount_percentage),
      description: form.description.trim(),
    }

    let error
    if (editingId) {
      ;({ error } = await supabase
        .from('scholarship_categories')
        .update(payload)
        .eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('scholarship_categories').insert(payload))
    }

    setSaving(false)

    if (error) {
      setServerError(error.message)
    } else {
      setShowForm(false)
      fetchCategories()
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error: deleteError } = await supabase
      .from('scholarship_categories')
      .delete()
      .eq('id', deleteTarget.id)

    setDeleting(false)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  return (
    <>
      <Topbar title="Scholarship Categories" />
      <div className="page-content">
        <p style={{ color: '#6b7184', marginTop: -8, marginBottom: 20 }}>
          Manage scholarship categories and discount percentages.
        </p>

        

        {error && <div className="banner-error">{error}</div>}

        <div className="card">
          {loading ? (
            <div className="loading-state">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="empty-state">No scholarship categories found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Category Name</th>
                  <th>Discount Percentage (%)</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const color = getBadgeColor(c.category_letter)
                  return (
                    <tr key={c.id}>
                      <td>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            background: color.bg,
                            color: color.text,
                          }}
                        >
                          {c.category_letter}
                        </div>
                      </td>
                      <td>{c.category_name}</td>
                      <td style={{ fontWeight: 600, color: color.text }}>
                        {c.discount_percentage}%
                      </td>
                      <td>{c.description}</td>
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
                  )
                })}
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
            <h2>{editingId ? 'Edit Category' : 'Add Category'}</h2>

            {serverError && <div className="banner-error">{serverError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Category Letter</label>
                <input
                  value={form.category_letter}
                  onChange={(e) => update('category_letter', e.target.value)}
                  placeholder="e.g. A"
                  maxLength={2}
                />
                {formErrors.category_letter && (
                  <span className="form-error">{formErrors.category_letter}</span>
                )}
              </div>

              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Category Name</label>
                <input
                  value={form.category_name}
                  onChange={(e) => update('category_name', e.target.value)}
                  placeholder="e.g. Category A"
                />
                {formErrors.category_name && (
                  <span className="form-error">{formErrors.category_name}</span>
                )}
              </div>

              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Discount Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discount_percentage}
                  onChange={(e) => update('discount_percentage', e.target.value)}
                  placeholder="e.g. 50"
                />
                {formErrors.discount_percentage && (
                  <span className="form-error">
                    {formErrors.discount_percentage}
                  </span>
                )}
              </div>

              <div className="form-field" style={{ marginBottom: 8 }}>
                <label>Description</label>
                <input
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="e.g. 50% waiver on total applicable fees"
                />
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
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Delete category?</h2>
            <p style={{ fontSize: 14, color: '#6b7184' }}>
              This will permanently delete{' '}
              <strong>{deleteTarget.category_name}</strong>. This action
              cannot be undone.
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