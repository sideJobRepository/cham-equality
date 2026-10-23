import { useCallback, useEffect, useState } from 'react'
import { fetchMembers, type AdminMember } from '@/api/adminApi'
import AdminMemberPushModal from '@/components/AdminMemberPushModal'
import Pagination from '@/components/common/Pagination'
import { useFeedback } from '@/hooks/useFeedback'
import { usePagedList } from '@/hooks/usePagedList'
import './AdminReportsPage.css'
import './AdminMembersPage.css'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

const SOCIAL_LABEL: Record<string, string> = {
  KAKAO: '카카오',
  NAVER: '네이버',
  APPLE: '애플',
}

export default function AdminMembersPage() {
  const { toast } = useFeedback()
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [target, setTarget] = useState<AdminMember | null>(null)

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedKeyword(keyword)
      setPage(0)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(debounceTimer)
  }, [keyword])

  // 조건이 바뀌면 fetcher가 새로 만들어지고, usePagedList가 그걸 새 요청으로 보고 다시 불러온다.
  const fetchPage = useCallback(() => fetchMembers(debouncedKeyword, page, PAGE_SIZE), [debouncedKeyword, page])
  const { data, loading, error, reload } = usePagedList(fetchPage)

  return (
    <div className="admin-reports-page admin-members-page">
      <header className="admin-header">
        <div>
          <h1>회원</h1>
          <p className="subtitle">
            총 {data?.totalElements ?? 0}명 · 알림 기기가 있는 회원에게만 푸시를 보낼 수 있어요
          </p>
        </div>
      </header>

      <div className="search-bar">
        <input
          value={keyword}
          onChange={(changeEvent) => setKeyword(changeEvent.target.value)}
          placeholder="이름 또는 이메일로 검색"
        />
        {keyword && (
          <button type="button" className="search-clear" onClick={() => setKeyword('')}>✕</button>
        )}
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
                  <th>이름</th>
                  <th>이메일</th>
                  <th>가입</th>
                  <th>알림 기기</th>
                  <th>가입일</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.content.map((member) => (
                  <tr key={member.id}>
                    <td>{member.id}</td>
                    <td>{member.name ?? '-'}</td>
                    <td className="ellipsis">{member.email || '-'}</td>
                    <td className="center">
                      {member.socialType ? SOCIAL_LABEL[member.socialType] ?? member.socialType : '-'}
                    </td>
                    <td className="center">{member.pushDeviceCount > 0 ? `${member.pushDeviceCount}대` : '없음'}</td>
                    <td className="date">{member.createDate?.slice(0, 10)}</td>
                    <td className="center">
                      <button
                        type="button"
                        className="push-btn"
                        disabled={member.pushDeviceCount === 0}
                        title={member.pushDeviceCount === 0 ? '앱에 로그인해 알림을 등록한 기기가 없어요' : undefined}
                        onClick={() => setTarget(member)}
                      >
                        푸시 보내기
                      </button>
                    </td>
                  </tr>
                ))}
                {data.empty && (
                  <tr>
                    <td colSpan={7} className="center">데이터 없음</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      {target && (
        <AdminMemberPushModal
          member={target}
          onClose={() => setTarget(null)}
          onSent={(sentDeviceCount) => {
            toast(`${target.name ?? `#${target.id}`}님의 기기 ${sentDeviceCount}대에 보냈어요.`)
            setTarget(null)
            reload()
          }}
        />
      )}
    </div>
  )
}
