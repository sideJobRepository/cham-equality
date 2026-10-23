import { useCallback, useState } from 'react'
import {
  fetchAppReports,
  type AdminAppReportFilter,
} from '@/api/adminApi'
import AdminAppReportDetailModal from '@/components/AdminAppReportDetailModal'
import Pagination from '@/components/common/Pagination'
import { useUrlFilter, useUrlPage } from '@/hooks/useListQuery'
import { usePagedList } from '@/hooks/usePagedList'
import './AdminReportsPage.css'

const PAGE_SIZE = 20

type Filter = AdminAppReportFilter | 'ALL'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
  { value: 'ALL', label: '전체' },
]

const FILTER_VALUES: readonly Filter[] = FILTERS.map((filterOption) => filterOption.value)

function yn(value: boolean | null): string {
  if (value === null || value === undefined) return '-'
  return value ? 'O' : 'X'
}

export default function AdminAppReportsPage() {
  // 필터·페이지는 URL 쿼리에 둔다(새로고침·뒤로가기·링크 공유 때 유지).
  const { filter, setFilter } = useUrlFilter(FILTER_VALUES, 'PENDING')
  const { page, setPage } = useUrlPage()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // 조건이 바뀌면 fetcher가 새로 만들어지고, usePagedList가 그걸 새 요청으로 보고 다시 불러온다.
  const fetchPage = useCallback(() => fetchAppReports(filter, page, PAGE_SIZE), [filter, page])
  const { data, loading, error, reload } = usePagedList(fetchPage)

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
            aria-pressed={filter === filterOption.value}
            onClick={() => setFilter(filterOption.value)}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* 처음 불러올 때만 문구를 띄우고, 이후엔 직전 표를 흐리게 남겨 깜빡임을 없앤다. */}
      {loading && !data && <div className="state">불러오는 중…</div>}
      {error && <div className="state error">{error}</div>}

      {data && !error && (
        <>
          <div className="reports-table-wrap" aria-busy={loading}>
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
            reload()
          }}
        />
      )}
    </div>
  )
}
