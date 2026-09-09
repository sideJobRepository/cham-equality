import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearAdminPassword,
  fetchFeedbacks,
  getAdminPassword,
  UnauthorizedError,
  type AppFeedback,
  type AppFeedbackStatus,
} from '@/api/adminApi'
import AdminLayout from '@/components/AdminLayout'
import AdminFeedbackDetailModal from '@/components/AdminFeedbackDetailModal'
import type { PageResponse } from '@/types/shelter'
import './AdminReportsPage.css'
import './AdminFeedbacksPage.css'

const PAGE_SIZE = 20

type Filter = AppFeedbackStatus | 'ALL'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'RECEIVED', label: '접수' },
  { value: 'IN_PROGRESS', label: '확인중' },
  { value: 'RESOLVED', label: '완료' },
  { value: 'ALL', label: '전체' },
]

const STATUS_LABEL: Record<AppFeedbackStatus, string> = {
  RECEIVED: '접수',
  IN_PROGRESS: '확인중',
  RESOLVED: '완료',
}

const CATEGORY_LABEL: Record<string, string> = {
  BUG: '오류/버그',
  IMPROVEMENT: '개선 제안',
  SHELTER_DATA: '대피소 정보 오류',
  CONTENT: '콘텐츠/번역 오류',
  ETC: '기타',
}

export default function AdminFeedbacksPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('RECEIVED')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<AppFeedback> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const handleUnauthorized = useCallback(() => {
    clearAdminPassword()
    navigate('/admin/login', { replace: true })
  }, [navigate])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchFeedbacks(filter, page, PAGE_SIZE)
      .then(setData)
      .catch((e: unknown) => {
        if (e instanceof UnauthorizedError) {
          handleUnauthorized()
          return
        }
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      })
      .finally(() => setLoading(false))
  }, [filter, page, handleUnauthorized])

  useEffect(() => {
    if (!getAdminPassword()) {
      navigate('/admin/login', { replace: true })
      return
    }
    load()
  }, [load, navigate])

  return (
    <AdminLayout>
    <div className="admin-reports-page">
      <header className="admin-header">
        <div>
          <h1>앱 피드백</h1>
          <p className="subtitle">
            총 {data?.totalElements ?? 0}건 · 페이지 {(data?.page ?? 0) + 1} / {data?.totalPages ?? 0}
          </p>
        </div>
      </header>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={filter === f.value ? 'active' : ''}
            onClick={() => {
              setFilter(f.value)
              setPage(0)
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <div className="state">불러오는 중…</div>}
      {error && <div className="state error">{error}</div>}

      {data && !loading && !error && (
        <>
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>분류</th>
                  <th>내용</th>
                  <th>플랫폼</th>
                  <th>앱버전</th>
                  <th>작성자</th>
                  <th>상태</th>
                  <th>접수</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((f) => (
                  <tr key={f.id} className="clickable" onClick={() => setSelectedId(f.id)}>
                    <td>{f.id}</td>
                    <td>{f.category ? CATEGORY_LABEL[f.category] ?? f.category : '-'}</td>
                    <td className="ellipsis">{f.content ?? '-'}</td>
                    <td className="center">{f.platform ?? '-'}</td>
                    <td className="center">{f.appVersion ?? '-'}</td>
                    <td className="center">{f.memberId !== null ? `#${f.memberId}` : '익명'}</td>
                    <td>
                      <span className={`badge badge-${f.status.toLowerCase()}`}>
                        {STATUS_LABEL[f.status]}
                      </span>
                    </td>
                    <td className="date">{f.createDate?.slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                ))}
                {data.empty && (
                  <tr>
                    <td colSpan={8} className="center">데이터 없음</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <nav className="pagination">
              <button disabled={page === 0} onClick={() => setPage(0)}>««</button>
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>«</button>
              <span>{page + 1} / {data.totalPages}</span>
              <button disabled={page >= data.totalPages - 1} onClick={() => setPage(page + 1)}>»</button>
              <button disabled={page >= data.totalPages - 1} onClick={() => setPage(data.totalPages - 1)}>»»</button>
            </nav>
          )}
        </>
      )}

      {selectedId !== null && (
        <AdminFeedbackDetailModal
          feedbackId={selectedId}
          onClose={() => setSelectedId(null)}
          onSaved={() => {
            setSelectedId(null)
            load()
          }}
          onUnauthorized={handleUnauthorized}
        />
      )}
    </div>
    </AdminLayout>
  )
}
