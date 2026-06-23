import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import Topbar from '../components/Topbar.jsx'
import { COURSE_OPTIONS, CATEGORY_OPTIONS, STATUS_OPTIONS } from '../constants.js'

const emptyForm = {
  full_name: '',
  roll_no: '',
  course: '',
  category: '',
  guardian_name: '',
  phone: '',
  admission_date: '',
  status: 'Active',
  address: '',
}

export default function StudentForm({ mode }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = mode === 'edit'

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (!isEdit) return

    async function loadStudent() {
      setLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        setServerError(error.message)
      } else if (data) {
        setForm({
          full_name: data.full_name || '',
          roll_no: data.roll_no || '',
          course: data.course || '',
          category: data.category || '',
          guardian_name: data.guardian_name || '',
          phone: data.phone || '',
          admission_date: data.admission_date || '',
          status: data.status || 'Active',
          address: data.address || '',
        })
      }
      setLoading(false)
    }

    loadStudent()
  }, [id, isEdit])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validate() {
    const next = {}
    if (!form.full_name.trim()) next.full_name = 'Full name is required'
    if (!form.roll_no.trim()) next.roll_no = 'Roll number is required'
    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone)) {
      next.phone = 'Enter a valid phone number'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setSaving(true)
    const payload = {
      full_name: form.full_name.trim(),
      roll_no: form.roll_no.trim(),
      course: form.course || null,
      category: form.category || null,
      guardian_name: form.guardian_name.trim() || null,
      phone: form.phone.trim() || null,
      admission_date: form.admission_date || null,
      status: form.status,
      address: form.address.trim() || null,
    }

    let error
    if (isEdit) {
      ;({ error } = await supabase.from('students').update(payload).eq('id', id))
    } else {
      ;({ error } = await supabase.from('students').insert(payload))
    }

    setSaving(false)

    if (error) {
      setServerError(error.message)
    } else {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <>
        <Topbar title={isEdit ? 'Edit Student' : 'Add Student'} backTo="/" backLabel="← Back to Students" />
        <div className="page-content loading-state">Loading...</div>
      </>
    )
  }

  return (
    <>
      <Topbar
        title={isEdit ? 'Edit Student' : 'Add Student'}
        backTo="/"
        backLabel="← Back to Students"
      />
      <div className="page-content">
        {serverError && <div className="banner-error">{serverError}</div>}

        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label>Full Name</label>
              <input
                value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
                placeholder="Enter full name"
              />
              {errors.full_name && (
                <span className="form-error">{errors.full_name}</span>
              )}
            </div>

            <div className="form-field">
              <label>Roll No</label>
              <input
                value={form.roll_no}
                onChange={(e) => update('roll_no', e.target.value)}
                placeholder="Enter roll number"
              />
              {errors.roll_no && (
                <span className="form-error">{errors.roll_no}</span>
              )}
            </div>

            <div className="form-field">
              <label>Course</label>
              <select
                value={form.course}
                onChange={(e) => update('course', e.target.value)}
              >
                <option value="">Select Course</option>
                {COURSE_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Scholarship Category</label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                <option value="">Select Category</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Father / Guardian Name</label>
              <input
                value={form.guardian_name}
                onChange={(e) => update('guardian_name', e.target.value)}
                placeholder="Enter guardian name"
              />
            </div>

            <div className="form-field">
              <label>Phone Number</label>
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <span className="form-error">{errors.phone}</span>
              )}
            </div>

            <div className="form-field">
              <label>Admission Date</label>
              <input
                type="date"
                value={form.admission_date}
                onChange={(e) => update('admission_date', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field full-width">
              <label>Address</label>
              <input
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Enter address"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
