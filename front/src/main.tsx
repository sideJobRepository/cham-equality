import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import ShelterListPage from './pages/ShelterListPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/research">
      <Routes>
        <Route path="/" element={<Navigate to="/shelters" replace />} />
        <Route path="/shelters" element={<ShelterListPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
