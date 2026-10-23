import { Link } from 'react-router-dom'
import AdminMaintenanceSection from '@/components/AdminMaintenanceSection'
import { usePendingCounts } from '@/hooks/usePendingCounts'
import { PENDING_COUNT_SOURCES } from '@/lib/pendingCounts'
import './AdminDashboardPage.css'

/**
 * 관리자 첫 화면. 처리를 기다리는 건수를 카드로 보여주고, 카드를 누르면 그 필터가 걸린 목록을 연다.
 * 숫자는 사이드바 배지와 같은 값(PendingCountsProvider)을 쓴다 — 화면에 들어올 때 Provider가 다시 불러온다.
 */
export default function AdminDashboardPage() {
  const { counts, loading, failed, refreshCounts } = usePendingCounts()

  return (
    <div className="admin-dashboard-page">
      <header className="admin-header">
        <div>
          <h1>대시보드</h1>
          <p className="subtitle">처리를 기다리는 일을 한눈에 봅니다</p>
        </div>
        <button
          type="button"
          className="dashboard-refresh"
          onClick={refreshCounts}
          disabled={loading}
        >
          {loading ? '불러오는 중…' : '새로고침'}
        </button>
      </header>

      {failed && (
        <div className="dashboard-error" role="alert">
          일부 건수를 불러오지 못했습니다. 새로고침을 눌러 다시 시도하세요.
        </div>
      )}

      <div className="dashboard-cards" aria-busy={loading}>
        {PENDING_COUNT_SOURCES.map((source) => {
          const count = counts[source.key]
          // 처음 불러오는 중이면 …, 불러오지 못했으면 — 로 둔다(0과 구분).
          const countText = count !== null ? count.toLocaleString() : loading ? '…' : '—'
          return (
            <Link key={source.key} to={source.listPath} className="dashboard-card">
              <span className="dashboard-card-label">{source.label}</span>
              <span className="dashboard-card-count">
                {countText}
                {count !== null && <span className="dashboard-card-unit">건</span>}
              </span>
              <span className="dashboard-card-description">{source.description}</span>
              <span className="dashboard-card-link" aria-hidden="true">
                목록 보기 →
              </span>
            </Link>
          )
        })}
      </div>

      <AdminMaintenanceSection />
    </div>
  )
}
