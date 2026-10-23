import { useCallback, useEffect, useState } from 'react'
import {
  fetchAppReports,
  type AdminAppReportFilter,
  type ShelterAppReport,
} from '@/api/adminApi'
import AdminAppReportDetailModal from '@/components/AdminAppReportDetailModal'
import Pagination from '@/components/common/Pagination'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import type { PageResponse } from '@/types/shelter'
import './AdminReportsPage.css'

const PAGE_SIZE = 20

type Filter = AdminAppReportFilter | 'ALL'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
  { value: 'ALL', label: '전체' },
]

function yn(value: boolean | null): string {
  if (value === null || value === undefined) return '-'
  return value ? 'O' : 'X'
}

export default function AdminAppReportsPage() {
  const { run } = useAdminRequest()
  const [filter, setFilter] = useState<Filter>('PENDING')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<ShelterAppReport> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await run(fetchAppReports(filter, page, PAGE_SIZE), '목록을 불러오지 못했습니다')
    if (result.ok) setData(result.data)
    else if (result.message) setError(result.message)
    setLoading(false)
  }, [filter, page, run])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="admin-reports-page">
      <header className="admin-header">
        <div>
          <h1>앱 제보 검토</h1>
          <p className="subtitle">
            총 {data?.totalElements ?? 0}건 · 페이지 {(data?.page ?? 0) + 1} / {data?.totalPages ?? 0}
          </p>
        </div>
      </header>

      <div className="filter-bar">
        {FILTERS.map((filterOption) => (
          <button
            key={filterOption.value}
            className={filter === filterOption.value ? 'active' : ''}
            onClick={() => {
              setFilter(filterOption.value)
              setPage(0)
            }}
          >
            {filterOption.label}
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
                  <th>상태</th>
                  <th>접수</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((report) => (
                  <tr key={report.id} className="clickable" onClick={() => setSelectedId(report.id)}>
                    <td>{report.id}</td>
                    <td>#{report.shelterId}</td>
                    <td className="ellipsis">{report.shelterName ?? '-'}</td>
                    <td className="ellipsis">{report.signageLanguage ?? '-'}</td>
                    <td className="center">{yn(report.accessibleToilet)}</td>
                    <td className="center">{yn(report.ramp)}</td>
                    <td className="center">{yn(report.elevator)}</td>
                    <td className="center">{yn(report.brailleBlock)}</td>
                    <td className="ellipsis">{report.etcFacilities ?? '-'}</td>
                    <td>
                      <span className={`badge badge-${report.requestStatus.toLowerCase()}`}>
                        {report.requestStatus === 'PENDING' ? '대기' : report.requestStatus === 'APPROVED' ? '승인' : '반려'}
                      </span>
                    </td>
                    <td className="date">{report.createDate?.slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                ))}
                {data.empty && (
                  <tr>
                    <td colSpan={11} className="center">데이터 없음</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      {selectedId !== null && (
        <AdminAppReportDetailModal
          reportId={selectedId}
          onClose={() => setSelectedId(null)}
          onActionDone={() => {
            setSelectedId(null)
            load()
          }}
        />
      )}
    </div>
  )
}
