import { useCallback, useState } from 'react'
import {
  fetchFeedbacks,
  type AppFeedbackStatus,
} from '@/api/adminApi'
import AdminFeedbackDetailModal from '@/components/AdminFeedbackDetailModal'
import Pagination from '@/components/common/Pagination'
import { useFeedback } from '@/hooks/useFeedback'
import { usePagedList } from '@/hooks/usePagedList'
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
  const { toast } = useFeedback()
  const [filter, setFilter] = useState<Filter>('RECEIVED')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // 조건이 바뀌면 fetcher가 새로 만들어지고, usePagedList가 그걸 새 요청으로 보고 다시 불러온다.
  const fetchPage = useCallback(() => fetchFeedbacks(filter, page, PAGE_SIZE), [filter, page])
  const { data, loading, error, reload } = usePagedList(fetchPage)

  return (
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
                {data.content.map((feedback) => (
                  <tr key={feedback.id} className="clickable" onClick={() => setSelectedId(feedback.id)}>
                    <td>{feedback.id}</td>
                    <td>{feedback.category ? CATEGORY_LABEL[feedback.category] ?? feedback.category : '-'}</td>
                    <td className="ellipsis">{feedback.content ?? '-'}</td>
                    <td className="center">{feedback.platform ?? '-'}</td>
                    <td className="center">{feedback.appVersion ?? '-'}</td>
                    <td className="center">{feedback.memberId !== null ? `#${feedback.memberId}` : '익명'}</td>
                    <td>
                      <span className={`badge badge-${feedback.status.toLowerCase()}`}>
                        {STATUS_LABEL[feedback.status]}
                      </span>
                    </td>
                    <td className="date">{feedback.createDate?.slice(0, 16).replace('T', ' ')}</td>
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

          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      {selectedId !== null && (
        <AdminFeedbackDetailModal
          key={selectedId}
          feedbackId={selectedId}
          onClose={() => setSelectedId(null)}
          onSaved={() => {
            setSelectedId(null)
            toast('저장되었습니다')
            reload()
          }}
        />
      )}
    </div>
  )
}
