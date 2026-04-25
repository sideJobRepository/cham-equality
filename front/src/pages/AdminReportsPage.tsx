import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  clearAdminPassword,
  fetchReports,
  getAdminPassword,
  UnauthorizedError,
  type AdminReportFilter,
  type ShelterReport,
} from '../api/adminApi'
import AdminReportDetailModal from '../components/AdminReportDetailModal'
import type { PageResponse } from '../types/shelter'
import './AdminReportsPage.css'

const PAGE_SIZE = 20

type Filter = AdminReportFilter | 'ALL'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
  { value: 'RE_INVESTIGATION', label: '재조사' },
  { value: 'ALL', label: '전체' },
]

function yn(v: boolean | null): string {
  if (v === null || v === undefined) return '-'
  return v ? 'O' : 'X'
}

export default function AdminReportsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('PENDING')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<ShelterReport> | null>(null)
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
    fetchReports(filter, page, PAGE_SIZE)
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

  const logout = () => {
    clearAdminPassword()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-reports-page">
      <header className="admin-header">
        <div>
          <h1>관리자 · 리포트 검토</h1>
          <p className="subtitle">
            총 {data?.totalElements ?? 0}건 · 페이지 {(data?.page ?? 0) + 1} / {data?.totalPages ?? 0}
          </p>
        </div>
        <div className="admin-header-actions">
          <Link to="/admin/shelters" className="shelter-link-btn">대피소 편집</Link>
          <Link to="/shelters" className="shelter-link-btn">← 대피소 목록</Link>
          <button type="button" className="logout-btn" onClick={logout}>
            로그아웃
          </button>
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
                  <th>대피소</th>
                  <th>시설명</th>
                  <th>안내문</th>
                  <th>화장실</th>
                  <th>경사로</th>
                  <th>엘베</th>
                  <th>점자</th>
                  <th>기타</th>
                  <th>메모</th>
                  <th>상태</th>
                  <th>접수</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((r) => (
                  <tr key={r.id} className="clickable" onClick={() => setSelectedId(r.id)}>
                    <td>{r.id}</td>
                    <td>#{r.shelterId}</td>
                    <td className="ellipsis">{r.shelterName ?? '-'}</td>
                    <td className="ellipsis">{r.signageLanguage ?? '-'}</td>
                    <td className="center">{yn(r.accessibleToilet)}</td>
                    <td className="center">{yn(r.ramp)}</td>
                    <td className="center">{yn(r.elevator)}</td>
                    <td className="center">{yn(r.brailleBlock)}</td>
                    <td className="ellipsis">{r.etcFacilities ?? '-'}</td>
                    <td className="ellipsis">{r.requestNote ?? '-'}</td>
                    <td>
                      <span className={`badge badge-${r.requestStatus.toLowerCase()}`}>
                        {r.requestStatus === 'PENDING' ? '대기' : r.requestStatus === 'APPROVED' ? '승인' : '반려'}
                      </span>
                    </td>
                    <td className="date">{r.createDate?.slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                ))}
                {data.empty && (
                  <tr>
                    <td colSpan={12} className="center">데이터 없음</td>
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
        <AdminReportDetailModal
          reportId={selectedId}
          onClose={() => setSelectedId(null)}
          onActionDone={() => {
            setSelectedId(null)
            load()
          }}
          onUnauthorized={handleUnauthorized}
        />
      )}
    </div>
  )
}
