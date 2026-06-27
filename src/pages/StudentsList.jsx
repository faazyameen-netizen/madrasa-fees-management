import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '../supabaseClient.js'
import Topbar from '../components/Topbar.jsx'
import { CATEGORY_OPTIONS, PAGE_SIZE } from '../constants.js'

export default function StudentsList() {
  const navigate = useNavigate()

  const [students, setStudents] = useState([])
  const [courseOptions, setCourseOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('All Courses')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [statusFilter, setStatusFilter] = useState('All Status')

  const [page, setPage] = useState(1)
  const [viewStudent, setViewStudent] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchStudents() {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setStudents(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    async function loadCourses() {
      const { data, error } = await supabase
        .from('courses')
        .select('course_name')
        .order('course_name', { ascending: true })

      if (!error && data) {
        setCourseOptions(data.map((c) => c.course_name))
      }
    }
    loadCourses()
  }, [])

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        !search ||
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.roll_no?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone?.toLowerCase().includes(search.toLowerCase())

      const matchesCourse =
        courseFilter === 'All Courses' || s.course === courseFilter
      const matchesCategory =
        categoryFilter === 'All Categories' || s.category === categoryFilter
      const matchesStatus =
        statusFilter === 'All Status' || s.status === statusFilter

      return matchesSearch && matchesCourse && matchesCategory && matchesStatus
    })
  }, [students, search, courseFilter, categoryFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function resetToFirstPage(setter) {
    return (value) => {
      setter(value)
      setPage(1)
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', deleteTarget.id)

    setDeleting(false)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  return (
    <>
      <Topbar title="Students" />
      <div className="page-content">
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 16,
          }}
        >
          <Link to="/students/add" className="btn btn-primary">
            <Plus size={16} /> Add Student
          </Link>
        </div>

        {error && <div className="banner-error">{error}</div>}

        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Search by name, roll no, phone..."
              value={search}
              onChange={(e) => resetToFirstPage(setSearch)(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={courseFilter}
            onChange={(e) => resetToFirstPage(setCourseFilter)(e.target.value)}
          >
            <option>All Courses</option>
            {courseOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) =>
              resetToFirstPage(setCategoryFilter)(e.target.value)
            }
          >
            <option>All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => resetToFirstPage(setStatusFilter)(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="card">
            <div className="loading-state">Loading students...</div>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="card">
            <div className="empty-state">No students found.</div>
          </div>
        ) : (
          <div className="card-list">
            {pageItems.map((s) => (
              <div key={s.id} className="data-card">
                <div className="data-card-top">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p className="data-card-title">{s.full_name}</p>
                    <p className="data-card-subtitle">{s.roll_no}</p>
                  </div>
                  <span
                    className={
                      'badge ' +
                      (s.status === 'Active' ? 'badge-active' : 'badge-inactive')
                    }
                    style={{ whiteSpace: 'nowrap', marginLeft: 8 }}
                  >
                    {s.status}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    padding: '10px 0',
                    borderTop: '1px solid #f0f1f5',
                    borderBottom: '1px solid #f0f1f5',
                    margin: '8px 0',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <div style={{ color: '#6b7184', fontSize: '10px', textTransform: 'uppercase', marginBottom: 3 }}>
                      Course
                    </div>
                    <div style={{ color: '#1f2330', fontWeight: 500, wordBreak: 'break-word' }}>
                      {s.course || '-'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7184', fontSize: '10px', textTransform: 'uppercase', marginBottom: 3 }}>
                      Category
                    </div>
                    <div style={{ color: '#1f2330', fontWeight: 500, wordBreak: 'break-word' }}>
                      {s.category || '-'}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ color: '#6b7184', fontSize: '10px', textTransform: 'uppercase', marginBottom: 3 }}>
                      Phone
                    </div>
                    <div style={{ color: '#1f2330', fontWeight: 500 }}>
                      {s.phone || '-'}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid #f0f1f5',
                  }}
                >
                  <button
                    onClick={() => setViewStudent(s)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontSize: '11px',
                      padding: '6px',
                      borderRadius: 6,
                      border: '1px solid #d9dce5',
                      background: '#fff',
                      color: '#4f46e5',
                      cursor: 'pointer',
                    }}
                  >
                    <Eye size={13} /> View
                  </button>
                  <button
                    onClick={() => navigate(`/students/edit/${s.id}`)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontSize: '11px',
                      padding: '6px',
                      borderRadius: 6,
                      border: '1px solid #d9dce5',
                      background: '#fff',
                      color: '#4f46e5',
                      cursor: 'pointer',
                    }}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(s)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontSize: '11px',
                      padding: '6px',
                      borderRadius: 6,
                      border: '1px solid #fdecec',
                      background: '#fff',
                      color: '#dc2626',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}

            {filtered.length > 0 && (
              <div className="table-footer mobile-pagination">
                <span>
                  {(currentPage - 1) * PAGE_SIZE + 1}-
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
                  {filtered.length}
                </span>
                <div className="pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {viewStudent && (
        <div className="modal-overlay" onClick={() => setViewStudent(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>{viewStudent.full_name}</h2>
            <div className="modal-row">
              <span>Roll No</span>
              <span>{viewStudent.roll_no}</span>
            </div>
            <div className="modal-row">
              <span>Course</span>
              <span>{viewStudent.course || '-'}</span>
            </div>
            <div className="modal-row">
              <span>Category</span>
              <span>{viewStudent.category || '-'}</span>
            </div>
            <div className="modal-row">
              <span>Guardian</span>
              <span>{viewStudent.guardian_name || '-'}</span>
            </div>
            <div className="modal-row">
              <span>Phone</span>
              <span>{viewStudent.phone || '-'}</span>
            </div>
            <div className="modal-row">
              <span>Admission Date</span>
              <span>{viewStudent.admission_date || '-'}</span>
            </div>
            <div className="modal-row">
              <span>Status</span>
              <span>{viewStudent.status}</span>
            </div>
            <div className="modal-row">
              <span>Address</span>
              <span>{viewStudent.address || '-'}</span>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setViewStudent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Delete student?</h2>
            <p style={{ fontSize: 14, color: '#6b7184' }}>
              This will permanently delete{' '}
              <strong>{deleteTarget.full_name}</strong> ({deleteTarget.roll_no}
              ). This action cannot be undone.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12 }}>
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