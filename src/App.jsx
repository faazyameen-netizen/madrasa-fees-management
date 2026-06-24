import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import StudentsList from './pages/StudentsList.jsx'
import StudentForm from './pages/StudentForm.jsx'
import CoursesList from './pages/CoursesList.jsx'
import ScholarshipPage from './pages/ScholarshipPage.jsx'
import InvoicesList from './pages/InvoicesList.jsx'
import GenerateInvoices from './pages/GenerateInvoices.jsx'
import FeesDesk from './pages/FeesDesk.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
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
        </Routes>
      </div>
    </div>
  )
}