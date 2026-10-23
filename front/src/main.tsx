import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import RequireAdmin from '@/components/RequireAdmin'
import { ADMIN_HOME_PATH } from '@/lib/adminRedirect'
import AdminLoginPage from '@/pages/AdminLoginPage'
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import AdminReportsPage from '@/pages/AdminReportsPage'
import AdminAppReportsPage from '@/pages/AdminAppReportsPage'
import AdminFeedbacksPage from '@/pages/AdminFeedbacksPage'
import AdminMembersPage from '@/pages/AdminMembersPage'
import AdminSheltersPage from '@/pages/AdminSheltersPage'
import AdminContentsPage from '@/pages/AdminContentsPage'
import AdminManualsPage from '@/pages/AdminManualsPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/research">
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        {/* 로그인 검사·사이드바·토스트는 RequireAdmin이 한 번에 맡는다. */}
        <Route element={<RequireAdmin />}>
          <Route path={ADMIN_HOME_PATH} element={<AdminDashboardPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/app-reports" element={<AdminAppReportsPage />} />
          <Route path="/admin/feedbacks" element={<AdminFeedbacksPage />} />
          <Route path="/admin/members" element={<AdminMembersPage />} />
          <Route path="/admin/shelters" element={<AdminSheltersPage />} />
          <Route path="/admin/contents" element={<AdminContentsPage />} />
          <Route path="/admin/manuals" element={<AdminManualsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
