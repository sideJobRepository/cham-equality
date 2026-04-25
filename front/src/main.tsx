import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import ShelterListPage from './pages/ShelterListPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminReportsPage from './pages/AdminReportsPage'
import AdminSheltersPage from './pages/AdminSheltersPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/research">
      <Routes>
        <Route path="/" element={<Navigate to="/shelters" replace />} />
        <Route path="/shelters" element={<ShelterListPage />} />
        <Route path="/admin" element={<Navigate to="/admin/reports" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/shelters" element={<AdminSheltersPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
