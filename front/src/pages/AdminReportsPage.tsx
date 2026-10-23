import { useCallback } from 'react'
import {
  fetchReports,
  type AdminReportFilter,
} from '@/api/adminApi'
import AdminReportDetailModal, { type ReportAction } from '@/components/AdminReportDetailModal'
import Pagination from '@/components/common/Pagination'
import { useUrlFilter, useUrlPage } from '@/hooks/useListQuery'
import { usePagedList } from '@/hooks/usePagedList'
import { usePendingCounts } from '@/hooks/usePendingCounts'
import { useReviewNavigation } from '@/hooks/useReviewNavigation'
import { REPORT_PENDING_FILTER } from '@/lib/pendingCounts'
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

const FILTER_VALUES: readonly Filter[] = FILTERS.map((filterOption) => filterOption.value)

function yn(value: boolean | null): string {
  if (value === null || value === undefined) return '-'
  return value ? 'O' : 'X'
}

export default function AdminReportsPage() {
  // 필터·페이지는 URL 쿼리에 둔다(새로고침·뒤로가기·링크 공유 때 유지).
  const { filter, setFilter } = useUrlFilter(FILTER_VALUES, REPORT_PENDING_FILTER)
  const { page, setPage } = useUrlPage()
  const { refreshCounts } = usePendingCounts()

  // 조건이 바뀌면 fetcher가 새로 만들어지고, usePagedList가 그걸 새 요청으로 보고 다시 불러온다.
  const fetchPage = useCallback(() => fetchReports(filter, page, PAGE_SIZE), [filter, page])
  const { data, loading, error, reload } = usePagedList(fetchPage)

  // 상세 모달의 이전/다음, 승인·반려 뒤 다음 대기 건. 페이지 밖 건은 같은 필터로 그 페이지를 받아 찾는다.
  const fetchPageAt = useCallback(
    (targetPage: number) => fetchReports(filter, targetPage, PAGE_SIZE),
    [filter],
  )
  const review = useReviewNavigation({ list: data, page, setPage, reload, fetchPageAt })

  return (
    <div className="admin-reports-page">
      <header className="admin-header">
        <div>
          <h1>리포트 검토</h1>
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
                  <th>조사자</th>
                  <th>대피소</th>
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
                {data.content.map((report) => (
                  <tr
                    key={report.id}
                    className={report.id === review.selectedId ? 'clickable selected' : 'clickable'}
                    onClick={() => review.open(report.id)}
                  >
                    <td>{report.id}</td>
                    <td className="ellipsis">{report.reporter ?? '-'}</td>
                    <td className="shelter-cell" title={report.shelterName ?? undefined}>
                      <span className="shelter-name">{report.shelterName ?? '이름 없음'}</span>
                      <span className="shelter-id">#{report.shelterId}</span>
                    </td>
                    <td className="ellipsis">{report.signageLanguage ?? '-'}</td>
                    <td className="center">{yn(report.accessibleToilet)}</td>
                    <td className="center">{yn(report.ramp)}</td>
                    <td className="center">{yn(report.elevator)}</td>
                    <td className="center">{yn(report.brailleBlock)}</td>
                    <td className="ellipsis">{report.etcFacilities ?? '-'}</td>
                    <td className="ellipsis">{report.requestNote ?? '-'}</td>
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
                    <td colSpan={12} className="center">데이터 없음</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      {review.selectedId !== null && (
        <AdminReportDetailModal
          reportId={review.selectedId}
          onClose={review.close}
          onActionDone={(action: ReportAction) => {
            const actedId = review.selectedId
            if (actedId === null) return
            // 사이드바 배지·대시보드의 대기 건수도 같이 갱신한다.
            refreshCounts()
            // 재조사 요청은 대기 건 처리가 아니라서 예전처럼 닫고 목록만 갱신한다.
            if (action === 'reInvestigate') {
              review.close()
              reload()
              return
            }
            review.openNextPending(actedId)
          }}
          onPrevious={review.hasPrevious ? review.goPrevious : undefined}
          onNext={review.hasNext ? review.goNext : undefined}
          navigating={review.navigating}
        />
      )}
    </div>
  )
}
