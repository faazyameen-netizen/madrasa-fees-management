import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import BottomNav from './components/BottomNav.jsx'
import MobileTopbar from './components/MobileTopbar.jsx'
import Login from './pages/Login.jsx'
import StudentsList from './pages/StudentsList.jsx'
import StudentForm from './pages/StudentForm.jsx'
import CoursesList from './pages/CoursesList.jsx'
import ScholarshipPage from './pages/ScholarshipPage.jsx'
import InvoicesList from './pages/InvoicesList.jsx'
import GenerateInvoices from './pages/GenerateInvoices.jsx'
import FeesDesk from './pages/FeesDesk.jsx'
import InvoiceDetails from './pages/InvoiceDetails.jsx'
import PaymentsHistory from './pages/PaymentsHistory.jsx'

export default function App() {
  const { session } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (session === undefined) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="app-shell">
      <MobileTopbar onOpenMenu={() => setMobileMenuOpen(true)} />

      {mobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="main-area">
        <Routes>
          <Route path="/" element={<StudentsList />} />
          <Route path="/students/add" element={<StudentForm mode="add" />} />
          <Route path="/students/edit/:id" element={<StudentForm mode="edit" />} />
          <Route path="/courses" element={<CoursesList />} />
          <Route path="/scholarship" element={<ScholarshipPage />} />
          <Route path="/invoices" element={<InvoicesList />} />
          <Route path="/invoices/generate" element={<GenerateInvoices />} />
          <Route path="/fees-desk" element={<FeesDesk />} />
          <Route path="/invoices/:id" element={<InvoiceDetails />} />
          <Route path="/payments" element={<PaymentsHistory />} />
        </Routes>
      </div>

      <BottomNav />
    </div>
  )
}