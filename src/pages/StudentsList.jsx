import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react'
import { supabase } from '../supabaseClient.js'
import Topbar from '../components/Topbar.jsx'
import { COURSE_OPTIONS, CATEGORY_OPTIONS, PAGE_SIZE } from '../constants.js'

export default function StudentsList() {
  const navigate = useNavigate()

  const [students, setStudents] = useState([])
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

  // Build a simple page number list, e.g. 1 2 3 ... last
  function pageNumbers() {
    const nums = []
    const last = totalPages
    const cur = currentPage
    const add = (n) => nums.push(n)

    add(1)
    if (cur > 3) nums.push('...')
    for (let n = Math.max(2, cur - 1); n <= Math.min(last - 1, cur + 1); n++) {
      add(n)
    }
    if (cur < last - 2) nums.push('...')
    if (last > 1) add(last)

    return [...new Set(nums)]
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
            {COURSE_OPTIONS.map((c) => (
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

        <div className="card">
          {loading ? (
            <div className="loading-state">Loading students...</div>
          ) : pageItems.length === 0 ? (
            <div className="empty-state">No students found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((s) => (
                  <tr key={s.id}>
                    <td>{s.roll_no}</td>
                    <td>{s.full_name}</td>
                    <td>{s.course}</td>
                    <td>{s.category}</td>
                    <td>{s.phone}</td>
                    <td>
                      <span
                        className={
                          'badge ' +
                          (s.status === 'Active'
                            ? 'badge-active'
                            : 'badge-inactive')
                        }
                      >
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-icons">
                        <button
                          title="View"
                          onClick={() => setViewStudent(s)}
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          title="Edit"
                          onClick={() => navigate(`/students/edit/${s.id}`)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          title="Delete"
                          className="icon-delete"
                          onClick={() => setDeleteTarget(s)}
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

          {!loading && filtered.length > 0 && (
            <div className="table-footer">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length} entries
              </span>
              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage(1)}
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                </button>
                {pageNumbers().map((n, idx) =>
                  n === '...' ? (
                    <span key={`dots-${idx}`} style={{ padding: '0 4px' }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={n}
                      className={n === currentPage ? 'active' : ''}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(totalPages)}
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
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
              <button
                className="btn btn-secondary"
                onClick={() => setViewStudent(null)}
              >
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
