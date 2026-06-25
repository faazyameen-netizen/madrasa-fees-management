import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import Topbar from '../components/Topbar.jsx'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

export default function GenerateInvoices() {
  const navigate = useNavigate()

  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(currentYear)

  const [includeTuition, setIncludeTuition] = useState(true)
  const [includeExam, setIncludeExam] = useState(false)
  const [includeBook, setIncludeBook] = useState(false)
  const [applyScholarship, setApplyScholarship] = useState(true)

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!includeTuition && !includeExam && !includeBook) {
      setError('Select at least one fee type to include.')
      return
    }

    setGenerating(true)

    try {
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, course, category, status')
        .eq('status', 'Active')

      if (studentsError) throw studentsError

      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('course_name, tuition_fee, exam_fee, book_fee')

      if (coursesError) throw coursesError
      const feesByCourse = {}
      for (const c of courses) {
        feesByCourse[c.course_name] = {
          tuition: Number(c.tuition_fee) || 0,
          exam: Number(c.exam_fee) || 0,
          book: Number(c.book_fee) || 0,
        }
      }

      let discountByCategory = {}
      if (applyScholarship) {
        const { data: cats, error: catsError } = await supabase
          .from('scholarship_categories')
          .select('category_letter, discount_percentage')

        if (catsError) throw catsError
        for (const c of cats) {
          discountByCategory[c.category_letter] = Number(c.discount_percentage) || 0
        }
      }

      // Existing invoices for this month, keyed by student_id, so we can
      // tell apart "create new" vs "add fees to existing" per student.
      const { data: existing, error: existingError } = await supabase
        .from('invoices')
        .select('*')
        .eq('month', month)
        .eq('year', year)

      if (existingError) throw existingError
      const existingByStudent = {}
      for (const inv of existing || []) {
        existingByStudent[inv.student_id] = inv
      }

      const newRows = []
      const updates = []
      let created = 0
      let updated = 0
      let skipped = 0

      for (const s of students) {
        const fees = feesByCourse[s.course] || { tuition: 0, exam: 0, book: 0 }
        const discountPct = applyScholarship ? discountByCategory[s.category] || 0 : 0
        const applyDiscount = (amt) =>
          Math.round(amt * (1 - discountPct / 100) * 100) / 100

        const addedTuition = includeTuition ? applyDiscount(fees.tuition) : 0
        const addedExam = includeExam ? applyDiscount(fees.exam) : 0
        const addedBook = includeBook ? applyDiscount(fees.book) : 0
        const addedTotal = addedTuition + addedExam + addedBook

        const existingInvoice = existingByStudent[s.id]

        if (existingInvoice) {
          // Only add what's newly checked. If, say, tuition was already
          // billed and you check tuition again, this would double-charge
          // it — so we only add a fee type if it wasn't already non-zero
          // on the existing invoice.
          const tuitionToAdd =
            includeTuition && Number(existingInvoice.tuition_amount) === 0
              ? addedTuition
              : 0
          const examToAdd =
            includeExam && Number(existingInvoice.exam_amount) === 0
              ? addedExam
              : 0
          const bookToAdd =
            includeBook && Number(existingInvoice.book_amount) === 0
              ? addedBook
              : 0
          const totalToAdd = tuitionToAdd + examToAdd + bookToAdd

          if (totalToAdd <= 0) {
            skipped++
            continue
          }

          const newTuition = Number(existingInvoice.tuition_amount) + tuitionToAdd
          const newExam = Number(existingInvoice.exam_amount) + examToAdd
          const newBook = Number(existingInvoice.book_amount) + bookToAdd
          const newTotal = Number(existingInvoice.total_amount) + totalToAdd

          // paid_amount is deliberately left untouched here.
          const newStatus =
            Number(existingInvoice.paid_amount) >= newTotal
              ? 'Paid'
              : Number(existingInvoice.paid_amount) > 0
              ? 'Partial'
              : 'Unpaid'

          updates.push({
            id: existingInvoice.id,
            tuition_amount: newTuition,
            exam_amount: newExam,
            book_amount: newBook,
            total_amount: newTotal,
            status: newStatus,
          })
          updated++
        } else {
          if (addedTotal <= 0) {
            skipped++
            continue
          }

          const invoiceNo = `INV-${year}-${String(month).padStart(2, '0')}-${s.id.slice(0, 6)}`
          newRows.push({
            invoice_no: invoiceNo,
            student_id: s.id,
            month,
            year,
            tuition_amount: addedTuition,
            exam_amount: addedExam,
            book_amount: addedBook,
            total_amount: addedTotal,
            paid_amount: 0,
            status: 'Unpaid',
          })
          created++
        }
      }

      if (newRows.length > 0) {
        const { error: insertError } = await supabase.from('invoices').insert(newRows)
        if (insertError) throw insertError
      }

      for (const u of updates) {
        const { id, ...fields } = u
        const { error: updateError } = await supabase
          .from('invoices')
          .update(fields)
          .eq('id', id)
        if (updateError) throw updateError
      }

      setResult({ created, updated, skipped })
    } catch (err) {
      setError(err.message || 'Something went wrong while generating invoices.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <Topbar
        title="Generate Monthly Invoices"
        backTo="/invoices"
        backLabel="← Back to Invoices"
      />
      <div className="page-content">
        {error && <div className="banner-error">{error}</div>}

        {result && (
          <div className="banner-success" style={{ marginBottom: 16 }}>
            Created {result.created} new invoice{result.created === 1 ? '' : 's'},
            updated {result.updated} existing invoice{result.updated === 1 ? '' : 's'}
            {result.skipped > 0
              ? `, skipped ${result.skipped} (already billed for the selected fees).`
              : '.'}
          </div>
        )}

        <form className="card form-card" onSubmit={handleGenerate}>
          <div className="form-grid">
            <div className="form-field">
              <label>Select Month</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Select Year</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field full-width">
              <label style={{ display: 'block', marginBottom: 8 }}>Include Fees</label>
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={includeTuition}
                    onChange={(e) => setIncludeTuition(e.target.checked)}
                  />
                  Tuition Fee (Monthly)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={includeExam}
                    onChange={(e) => setIncludeExam(e.target.checked)}
                  />
                  Exam Fee (Term)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={includeBook}
                    onChange={(e) => setIncludeBook(e.target.checked)}
                  />
                  Book Fee (One Time)
                </label>
              </div>
            </div>

            <div className="form-field full-width">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                <input
                  type="checkbox"
                  checked={applyScholarship}
                  onChange={(e) => setApplyScholarship(e.target.checked)}
                />
                Apply scholarship discount based on each student's category
              </label>
            </div>
          </div>

          <p style={{ fontSize: 13, color: '#6b7184', marginTop: 4 }}>
            If a student already has an invoice for this month, checked fees
            that haven't been billed yet are added on top of their existing
            invoice — already-billed fee types and any payments already
            made are left untouched.
          </p>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/invoices')}
              disabled={generating}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={generating}>
              {generating ? 'Generating...' : 'Generate Invoices'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}