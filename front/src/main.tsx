import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import ShelterListPage from '@/pages/temp/ShelterListPage'
import AdminLoginPage from '@/pages/AdminLoginPage'
import AdminReportsPage from '@/pages/AdminReportsPage'
import AdminSheltersPage from '@/pages/AdminSheltersPage'
import AdminContentsPage from '@/pages/AdminContentsPage'
import AdminManualsPage from '@/pages/AdminManualsPage'

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
        <Route path="/admin/contents" element={<AdminContentsPage />} />
        <Route path="/admin/manuals" element={<AdminManualsPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
