import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { supabase } from '../supabaseClient.js'
import Topbar from '../components/Topbar.jsx'

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatRupees(value) {
  const num = Number(value) || 0
  return '₹' + num.toLocaleString('en-IN')
}

function statusColors(status) {
  if (status === 'Paid')    return { bg: '#f0faf4', border: '#b6e8c8', label: '#1a7a45', badge: '#e6f7ed', badgeText: '#1a7a45' }
  if (status === 'Partial') return { bg: '#fffaf0', border: '#fddba0', label: '#b45309', badge: '#fef3cd', badgeText: '#b45309' }
  return                           { bg: '#fff5f5', border: '#fdc5c5', label: '#c0392b', badge: '#fde8e8', badgeText: '#c0392b' }
}

export default function FeesDesk() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [showResults, setShowResults] = useState(false)

  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentInvoices, setStudentInvoices] = useState([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [error, setError] = useState('')

  const [payingInvoice, setPayingInvoice] = useState(null)
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('Cash')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    async function loadStudents() {
      const { data, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, roll_no')
        .order('full_name', { ascending: true })
      if (!studentsError && data) setStudents(data)
    }
    loadStudents()
  }, [])

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const term = search.trim().toLowerCase()
    return students
      .filter(s =>
        s.full_name?.toLowerCase().includes(term) ||
        s.roll_no?.toLowerCase().includes(term)
      )
      .slice(0, 8)
  }, [students, search])

  async function loadInvoicesForStudent(student) {
    setSelectedStudent(student)
    setSearch(student.full_name)
    setShowResults(false)
    setStudentInvoices([])
    setError('')
    setSuccessMsg('')
    setLoadingInvoices(true)

    const { data, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('student_id', student.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (invError) setError(invError.message)
    else setStudentInvoices(data || [])
    setLoadingInvoices(false)
  }

  function clearSelection() {
    setSelectedStudent(null)
    setStudentInvoices([])
    setSearch('')
    setSuccessMsg('')
    setError('')
  }

  function openPaymentForm(invoice) {
    setPayingInvoice(invoice)
    const pending = Number(invoice.total_amount) - Number(invoice.paid_amount)
    setAmount(pending > 0 ? String(pending) : '')
    setMode('Cash')
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setNote('')
    setFormError('')
  }

  async function handleRecordPayment(e) {
    e.preventDefault()
    setFormError('')

    const pending = Number(payingInvoice.total_amount) - Number(payingInvoice.paid_amount)
    const amt = Number(amount)

    if (!amount || amt <= 0) { setFormError('Enter a valid payment amount'); return }
    if (amt > pending) { setFormError(`Amount cannot exceed pending balance of ${formatRupees(pending)}`); return }

    setSaving(true)

    const { error: paymentError } = await supabase.from('payments').insert({
      invoice_id: payingInvoice.id,
      amount: amt,
      payment_mode: mode,
      payment_date: paymentDate,
      note: note.trim() || null,
    })

    if (paymentError) { setFormError(paymentError.message); setSaving(false); return }

    const newPaidAmount = Number(payingInvoice.paid_amount) + amt
    const newStatus = newPaidAmount >= Number(payingInvoice.total_amount) ? 'Paid' : 'Partial'

    const { error: updateError } = await supabase
      .from('invoices')
      .update({ paid_amount: newPaidAmount, status: newStatus })
      .eq('id', payingInvoice.id)

    setSaving(false)
    if (updateError) { setFormError(updateError.message); return }

    setSuccessMsg(`Payment of ${formatRupees(amt)} recorded for invoice ${payingInvoice.invoice_no}.`)
    setPayingInvoice(null)
    loadInvoicesForStudent(selectedStudent)
  }

  // summary stats
  const summary = useMemo(() => {
    const total = studentInvoices.length
    const collected = studentInvoices.reduce((s, i) => s + Number(i.paid_amount), 0)
    const pending = studentInvoices.reduce((s, i) => s + (Number(i.total_amount) - Number(i.paid_amount)), 0)
    const partial = studentInvoices.filter(i => i.status === 'Partial').length
    return { total, collected, pending, partial }
  }, [studentInvoices])

  return (
    <>
      <Topbar title="Fees Desk" />
      <div className="page-content">
        <p style={{ color: '#6b7184', marginTop: -8, marginBottom: 20 }}>
          Search for a student to view their invoices and record a payment.
        </p>

        {error && <div className="banner-error">{error}</div>}
        {successMsg && <div className="banner-success">{successMsg}</div>}

        {/* Search box */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9aa1b5', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setShowResults(true)
                if (!e.target.value) clearSelection()
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search student by name or roll no…"
              style={{ paddingLeft: 34, paddingRight: selectedStudent ? 34 : 12, width: '100%', boxSizing: 'border-box' }}
            />
            {selectedStudent && (
              <button
                type="button"
                onClick={clearSelection}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9aa1b5', display: 'flex' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {showResults && search.trim() && !selectedStudent && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #d9dce5', borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '10px 14px', fontSize: 13, color: '#6b7184' }}>No matching students.</div>
              ) : (
                searchResults.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => loadInvoicesForStudent(s)}
                    onMouseDown={(e) => e.preventDefault()}
                    style={{ padding: '12px 14px', fontSize: 14, lineHeight: 1.4, cursor: 'pointer', borderBottom: '1px solid #f0f1f5' }}
                  >
                    <div style={{ fontWeight: 500 }}>{s.full_name}</div>
                    <div style={{ color: '#6b7184', fontSize: 12 }}>{s.roll_no}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Summary cards — only when student selected */}
        {selectedStudent && !loadingInvoices && studentInvoices.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div className="summary-card">
              <span className="summary-label">Total Invoices</span>
              <span className="summary-value">{summary.total}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Collected</span>
              <span className="summary-value summary-success">{formatRupees(summary.collected)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Pending</span>
              <span className="summary-value" style={{ color: summary.pending > 0 ? '#c0392b' : 'inherit' }}>{formatRupees(summary.pending)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Partial Payments</span>
              <span className="summary-value">{summary.partial}</span>
            </div>
          </div>
        )}

        {/* Invoice cards */}
        {selectedStudent && (
          loadingInvoices ? (
            <div className="card"><div className="loading-state">Loading invoices...</div></div>
          ) : studentInvoices.length === 0 ? (
            <div className="card"><div className="empty-state">No invoices found for this student yet.</div></div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="card desktop-only">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Month</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentInvoices.map((inv) => {
                      const pending = Number(inv.total_amount) - Number(inv.paid_amount)
                      return (
                        <tr key={inv.id}>
                          <td>{inv.invoice_no}</td>
                          <td>{MONTH_NAMES[inv.month - 1]} {inv.year}</td>
                          <td>{formatRupees(inv.total_amount)}</td>
                          <td>{formatRupees(inv.paid_amount)}</td>
                          <td>{formatRupees(pending)}</td>
                          <td>
                            <span className={'badge ' + (inv.status === 'Paid' ? 'badge-active' : inv.status === 'Partial' ? 'badge-partial' : 'badge-inactive')}>
                              {inv.status}
                            </span>
                          </td>
                          <td>
                            {inv.status !== 'Paid' && (
                              <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => openPaymentForm(inv)}>
                                Add Payment
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards — matches invoice design */}
              <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {studentInvoices.map((inv) => {
                  const pending = Number(inv.total_amount) - Number(inv.paid_amount)
                  const c = statusColors(inv.status)
                  return (
                    <div
                      key={inv.id}
                      style={{
                        background: c.bg,
                        border: `1px solid ${c.border}`,
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      {/* Top row: invoice no + badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: c.label }}>{inv.invoice_no}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
                          background: c.badge, color: c.badgeText, border: `1px solid ${c.border}`
                        }}>
                          {inv.status}
                        </span>
                      </div>

                      {/* Student name subtitle */}
                      <div style={{ fontSize: 12, color: c.label, marginBottom: 10, opacity: 0.8 }}>
                        {MONTH_NAMES[inv.month - 1]} {inv.year}
                      </div>

                      {/* Amount rows */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[
                          ['Total', formatRupees(inv.total_amount)],
                          ['Paid', formatRupees(inv.paid_amount)],
                          ['Pending', formatRupees(pending)],
                        ].map(([label, val]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: c.label, opacity: 0.75 }}>{label}</span>
                            <span style={{ fontWeight: 500, color: c.label }}>{val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Add Payment button */}
                      {inv.status !== 'Paid' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => openPaymentForm(inv)}
                          style={{ marginTop: 12, width: '100%', fontSize: 13, padding: '8px 0' }}
                        >
                          Add Payment
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )
        )}
      </div>

      {/* Payment Modal */}
      {payingInvoice && (
        <div className="modal-overlay" onClick={() => setPayingInvoice(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Add Payment</h2>
            <div className="modal-row"><span>Invoice No</span><span>{payingInvoice.invoice_no}</span></div>
            <div className="modal-row">
              <span>Pending Amount</span>
              <span>{formatRupees(Number(payingInvoice.total_amount) - Number(payingInvoice.paid_amount))}</span>
            </div>

            {formError && <div className="banner-error">{formError}</div>}

            <form onSubmit={handleRecordPayment}>
              <div className="form-field" style={{ marginTop: 16, marginBottom: 16 }}>
                <label>Payment Amount</label>
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
              </div>
              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Payment Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Payment Date</label>
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
              <div className="form-field" style={{ marginBottom: 8 }}>
                <label>Note (Optional)</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Enter note" />
              </div>
              <div className="modal-actions" style={{ gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPayingInvoice(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
