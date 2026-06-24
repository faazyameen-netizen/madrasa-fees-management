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
  const [applyScholarship, setApplyScholarship] = useState(true)

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    setGenerating(true)

    try {
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, course, category, status')
        .eq('status', 'Active')

      if (studentsError) throw studentsError

      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('course_name, tuition_fee')

      if (coursesError) throw coursesError
      const feeByCourse = {}
      for (const c of courses) feeByCourse[c.course_name] = Number(c.tuition_fee) || 0

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

      const { data: existing, error: existingError } = await supabase
        .from('invoices')
        .select('student_id')
        .eq('month', month)
        .eq('year', year)

      if (existingError) throw existingError
      const alreadyInvoiced = new Set((existing || []).map((r) => r.student_id))

      const rows = []
      let skipped = 0

      for (const s of students) {
        if (alreadyInvoiced.has(s.id)) {
          skipped++
          continue
        }

        const tuitionFee = feeByCourse[s.course] || 0
        const discountPct = applyScholarship ? discountByCategory[s.category] || 0 : 0
        const total = Math.round(tuitionFee * (1 - discountPct / 100) * 100) / 100

        const invoiceNo = `INV-${year}-${String(month).padStart(2, '0')}-${s.id.slice(0, 6)}`

        rows.push({
          invoice_no: invoiceNo,
          student_id: s.id,
          month,
          year,
          total_amount: total,
          paid_amount: 0,
          status: 'Unpaid',
        })
      }

      if (rows.length > 0) {
        const { error: insertError } = await supabase.from('invoices').insert(rows)
        if (insertError) throw insertError
      }

      setResult({ created: rows.length, skipped })
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
            Created {result.created} invoice{result.created === 1 ? '' : 's'}
            {result.skipped > 0
              ? `. Skipped ${result.skipped} student${
                  result.skipped === 1 ? '' : 's'
                } who already had an invoice for this month.`
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            This generates one invoice per active student for the selected
            month, using their course's tuition fee
            {applyScholarship ? ' minus their scholarship discount' : ''}.
            Students who already have an invoice for this month are skipped
            automatically.
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