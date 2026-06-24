import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import Topbar from '../components/Topbar.jsx'

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque']

function formatRupees(value) {
  const num = Number(value) || 0
  return '₹' + num.toLocaleString('en-IN')
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function FeesDesk() {
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentInvoices, setStudentInvoices] = useState([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [error, setError] = useState('')

  const [payingInvoice, setPayingInvoice] = useState(null)
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('Cash')
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
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

  async function loadInvoicesForStudent(studentId) {
    setSelectedStudentId(studentId)
    setStudentInvoices([])
    setError('')
    setSuccessMsg('')
    if (!studentId) return

    setLoadingInvoices(true)
    const { data, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('student_id', studentId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (invError) {
      setError(invError.message)
    } else {
      setStudentInvoices(data || [])
    }
    setLoadingInvoices(false)
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

    const pending =
      Number(payingInvoice.total_amount) - Number(payingInvoice.paid_amount)
    const amt = Number(amount)

    if (!amount || amt <= 0) {
      setFormError('Enter a valid payment amount')
      return
    }
    if (amt > pending) {
      setFormError(`Amount cannot exceed pending balance of ${formatRupees(pending)}`)
      return
    }

    setSaving(true)

    const { error: paymentError } = await supabase.from('payments').insert({
      invoice_id: payingInvoice.id,
      amount: amt,
      payment_mode: mode,
      payment_date: paymentDate,
      note: note.trim() || null,
    })

    if (paymentError) {
      setFormError(paymentError.message)
      setSaving(false)
      return
    }

    const newPaidAmount = Number(payingInvoice.paid_amount) + amt
    const newStatus =
      newPaidAmount >= Number(payingInvoice.total_amount) ? 'Paid' : 'Partial'

    const { error: updateError } = await supabase
      .from('invoices')
      .update({ paid_amount: newPaidAmount, status: newStatus })
      .eq('id', payingInvoice.id)

    setSaving(false)

    if (updateError) {
      setFormError(updateError.message)
      return
    }

    setSuccessMsg(
      `Payment of ${formatRupees(amt)} recorded for invoice ${payingInvoice.invoice_no}.`
    )
    setPayingInvoice(null)
    loadInvoicesForStudent(selectedStudentId)
  }

  return (
    <>
      <Topbar title="Fees Desk" />
      <div className="page-content">
        <p style={{ color: '#6b7184', marginTop: -8, marginBottom: 20 }}>
          Select a student to view their invoices and record a payment.
        </p>

        {error && <div className="banner-error">{error}</div>}
        {successMsg && <div className="banner-success">{successMsg}</div>}

        <div className="card form-card" style={{ marginBottom: 20 }}>
          <div className="form-field" style={{ maxWidth: 360 }}>
            <label>Select Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => loadInvoicesForStudent(e.target.value)}
            >
              <option value="">Choose a student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.roll_no})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedStudentId && (
          <div className="card">
            {loadingInvoices ? (
              <div className="loading-state">Loading invoices...</div>
            ) : studentInvoices.length === 0 ? (
              <div className="empty-state">
                No invoices found for this student yet.
              </div>
            ) : (
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
                    const pending =
                      Number(inv.total_amount) - Number(inv.paid_amount)
                    return (
                      <tr key={inv.id}>
                        <td>{inv.invoice_no}</td>
                        <td>
                          {MONTH_NAMES[inv.month - 1]} {inv.year}
                        </td>
                        <td>{formatRupees(inv.total_amount)}</td>
                        <td>{formatRupees(inv.paid_amount)}</td>
                        <td>{formatRupees(pending)}</td>
                        <td>
                          <span
                            className={
                              'badge ' +
                              (inv.status === 'Paid'
                                ? 'badge-active'
                                : inv.status === 'Partial'
                                ? 'badge-partial'
                                : 'badge-inactive')
                            }
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td>
                          {inv.status !== 'Paid' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '6px 14px', fontSize: 13 }}
                              onClick={() => openPaymentForm(inv)}
                            >
                              Add Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {payingInvoice && (
        <div className="modal-overlay" onClick={() => setPayingInvoice(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Add Payment</h2>
            <div className="modal-row">
              <span>Invoice No</span>
              <span>{payingInvoice.invoice_no}</span>
            </div>
            <div className="modal-row">
              <span>Pending Amount</span>
              <span>
                {formatRupees(
                  Number(payingInvoice.total_amount) -
                    Number(payingInvoice.paid_amount)
                )}
              </span>
            </div>

            {formError && <div className="banner-error">{formError}</div>}

            <form onSubmit={handleRecordPayment}>
              <div className="form-field" style={{ marginTop: 16, marginBottom: 16 }}>
                <label>Payment Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Payment Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  {PAYMENT_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field" style={{ marginBottom: 16 }}>
                <label>Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="form-field" style={{ marginBottom: 8 }}>
                <label>Note (Optional)</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter note"
                />
              </div>

              <div className="modal-actions" style={{ gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPayingInvoice(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}