import { NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { clearAdminPassword } from '@/api/adminApi'
import './AdminLayout.css'

const MENU = [
  { to: '/admin/reports', label: '웹 제보 검토' },
  { to: '/admin/app-reports', label: '앱 제보 검토' },
  { to: '/admin/feedbacks', label: '앱 피드백' },
  { to: '/admin/members', label: '회원' },
  { to: '/admin/shelters', label: '대피소 편집' },
  { to: '/admin/contents', label: '컨텐츠 관리' },
  { to: '/admin/manuals', label: '매뉴얼 관리' },
]

type Props = {
  children: ReactNode
}

export default function AdminLayout({ children }: Props) {
  const navigate = useNavigate()

  const logout = () => {
    clearAdminPassword()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-title">관리자</div>
          <div className="admin-sidebar-subtitle">모두의 안전</div>
        </div>
        <nav className="admin-sidebar-nav">
          {MENU.map((menuItem) => (
            <NavLink
              key={menuItem.to}
              to={menuItem.to}
              className={({ isActive }) =>
                'admin-sidebar-link' + (isActive ? ' active' : '')
              }
            >
              {menuItem.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button type="button" className="admin-sidebar-logout" onClick={logout}>
            로그아웃
          </button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
