import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

export default function InvoiceDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [invoice, setInvoice] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('Cash')
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function fetchInvoiceAndPayments() {
    setLoading(true)
    setError('')

    const { data: invData, error: invError } = await supabase
      .from('invoices')
      .select('*, students(full_name, roll_no, course, category)')
      .eq('id', id)
      .single()

    if (invError) {
      setError(invError.message)
      setLoading(false)
      return
    }
    setInvoice(invData)

    const { data: payData, error: payError } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', id)
      .order('payment_date', { ascending: false })

    if (payError) {
      setError(payError.message)
    } else {
      setPayments(payData || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchInvoiceAndPayments()
  }, [id])

  function openPaymentForm() {
    const pending = Number(invoice.total_amount) - Number(invoice.paid_amount)
    setAmount(pending > 0 ? String(pending) : '')
    setMode('Cash')
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setNote('')
    setFormError('')
    setShowPaymentForm(true)
  }

  async function handleRecordPayment(e) {
    e.preventDefault()
    setFormError('')

    const pending = Number(invoice.total_amount) - Number(invoice.paid_amount)
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
      invoice_id: invoice.id,
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

    const newPaidAmount = Number(invoice.paid_amount) + amt
    const newStatus =
      newPaidAmount >= Number(invoice.total_amount) ? 'Paid' : 'Partial'

    const { error: updateError } = await supabase
      .from('invoices')
      .update({ paid_amount: newPaidAmount, status: newStatus })
      .eq('id', invoice.id)

    setSaving(false)

    if (updateError) {
      setFormError(updateError.message)
      return
    }

    setShowPaymentForm(false)
    fetchInvoiceAndPayments()
  }

  if (loading) {
    return (
      <>
        <Topbar
          title="Invoice Details"
          backTo="/invoices"
          backLabel="← Back to Invoices"
        />
        <div className="page-content loading-state">Loading...</div>
      </>
    )
  }

  if (error || !invoice) {
    return (
      <>
        <Topbar
          title="Invoice Details"
          backTo="/invoices"
          backLabel="← Back to Invoices"
        />
        <div className="page-content">
          <div className="banner-error">{error || 'Invoice not found.'}</div>
        </div>
      </>
    )
  }

  const pending = Number(invoice.total_amount) - Number(invoice.paid_amount)

  return (
    <>
      <Topbar
        title={`Invoice ${invoice.invoice_no}`}
        backTo="/invoices"
        backLabel="← Back to Invoices"
      />
      <div className="page-content">
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="modal-row">
            <span>Student</span>
            <span>
              {invoice.students?.full_name} ({invoice.students?.roll_no})
            </span>
          </div>
          <div className="modal-row">
            <span>Course</span>
            <span>{invoice.students?.course || '-'}</span>
          </div>
          <div className="modal-row">
            <span>Month</span>
            <span>
              {MONTH_NAMES[invoice.month - 1]} {invoice.year}
            </span>
          </div>
        <div className="modal-row">
            <span>Tuition Fee</span>
            <span>{formatRupees(invoice.tuition_amount)}</span>
          </div>
          <div className="modal-row">
            <span>Exam Fee</span>
            <span>{formatRupees(invoice.exam_amount)}</span>
          </div>
          <div className="modal-row">
            <span>Book Fee</span>
            <span>{formatRupees(invoice.book_amount)}</span>
          </div>
          <div className="modal-row" style={{ fontWeight: 600 }}>
            <span>Total Amount</span>
            <span>{formatRupees(invoice.total_amount)}</span>
          </div>
          <div className="modal-row">
            <span>Paid Amount</span>
            <span>{formatRupees(invoice.paid_amount)}</span>
          </div>
          <div className="modal-row">
            <span>Pending Amount</span>
            <span style={{ fontWeight: 600, color: pending > 0 ? '#d4373e' : '#1a9d50' }}>
              {formatRupees(pending)}
            </span>
          </div>
          <div className="modal-row">
            <span>Status</span>
            <span
              className={
                'badge ' +
                (invoice.status === 'Paid'
                  ? 'badge-active'
                  : invoice.status === 'Partial'
                  ? 'badge-partial'
                  : 'badge-inactive')
              }
            >
              {invoice.status}
            </span>
          </div>

          {invoice.status !== 'Paid' && (
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={openPaymentForm}>
                Add Payment
              </button>
            </div>
          )}
        </div>

        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Payment History</h3>
        <div className="card">
          {payments.length === 0 ? (
            <div className="empty-state">No payments recorded yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.payment_date}</td>
                    <td>{formatRupees(p.amount)}</td>
                    <td>{p.payment_mode}</td>
                    <td>{p.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showPaymentForm && (
        <div className="modal-overlay" onClick={() => setShowPaymentForm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Add Payment</h2>
            <div className="modal-row">
              <span>Pending Amount</span>
              <span>{formatRupees(pending)}</span>
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
                  onClick={() => setShowPaymentForm(false)}
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