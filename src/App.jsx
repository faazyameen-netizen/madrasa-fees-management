import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import StudentsList from './pages/StudentsList.jsx'
import StudentForm from './pages/StudentForm.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Routes>
          <Route path="/" element={<StudentsList />} />
          <Route path="/students/add" element={<StudentForm mode="add" />} />
          <Route path="/students/edit/:id" element={<StudentForm mode="edit" />} />
        </Routes>
      </div>
    </div>
  )
}
