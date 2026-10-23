import { NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { clearAdminPassword } from '@/api/adminApi'
import { usePendingCounts } from '@/hooks/usePendingCounts'
import { ADMIN_HOME_PATH } from '@/lib/adminRedirect'
import type { PendingCountKey } from '@/lib/pendingCounts'
import './AdminLayout.css'

type MenuItem = {
  to: string
  label: string
  /** 메뉴 옆에 대기 건수 배지를 붙일 때 어떤 건수인지 */
  countKey?: PendingCountKey
  /** 하위 경로에서도 켜지지 않게 정확히 일치할 때만 활성(대시보드 `/admin`용) */
  end?: boolean
}

// 배지 숫자가 이보다 크면 줄여 쓴다(좁은 사이드바에서 메뉴 이름을 밀어내지 않게).
const MAX_BADGE_COUNT = 99

const MENU: MenuItem[] = [
  { to: ADMIN_HOME_PATH, label: '대시보드', end: true },
  { to: '/admin/reports', label: '웹 제보 검토', countKey: 'webReports' },
  { to: '/admin/app-reports', label: '앱 제보 검토', countKey: 'appReports' },
  { to: '/admin/feedbacks', label: '앱 피드백', countKey: 'feedbacks' },
  { to: '/admin/members', label: '회원' },
  { to: '/admin/shelters', label: '대피소 편집' },
  { to: '/admin/contents', label: '컨텐츠 관리' },
  { to: '/admin/manuals', label: '매뉴얼 관리' },
  { to: '/admin/app-bundles', label: '앱 업데이트' },
]

type Props = {
  children: ReactNode
}

export default function AdminLayout({ children }: Props) {
  const navigate = useNavigate()
  const { counts } = usePendingCounts()

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
          {MENU.map((menuItem) => {
            const pendingCount = menuItem.countKey ? counts[menuItem.countKey] : null
            return (
              <NavLink
                key={menuItem.to}
                to={menuItem.to}
                end={menuItem.end}
                className={({ isActive }) =>
                  'admin-sidebar-link' + (isActive ? ' active' : '')
                }
              >
                <span className="admin-sidebar-link-label">{menuItem.label}</span>
                {/* 0건이거나 아직 모르면(불러오는 중·실패) 배지를 숨긴다. */}
                {pendingCount !== null && pendingCount > 0 && (
                  <span className="admin-sidebar-badge" title={`처리 대기 ${pendingCount}건`}>
                    {/* 화면 읽기 프로그램엔 "웹 제보 검토 처리 대기 3건"처럼 읽히게 숨은 글자를 붙인다. */}
                    <span className="admin-visually-hidden">처리 대기 </span>
                    {pendingCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : pendingCount}
                    <span className="admin-visually-hidden">건</span>
                  </span>
                )}
              </NavLink>
            )
          })}
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
