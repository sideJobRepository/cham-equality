import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearAdminPassword,
  fetchMembers,
  getAdminPassword,
  UnauthorizedError,
  type AdminMember,
} from '@/api/adminApi'
import AdminLayout from '@/components/AdminLayout'
import AdminMemberPushModal from '@/components/AdminMemberPushModal'
import type { PageResponse } from '@/types/shelter'
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
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<AdminMember> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState<AdminMember | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const handleUnauthorized = useCallback(() => {
    clearAdminPassword()
    navigate('/admin/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedKeyword(keyword)
      setPage(0)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [keyword])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchMembers(debouncedKeyword, page, PAGE_SIZE)
      .then(setData)
      .catch((e: unknown) => {
        if (e instanceof UnauthorizedError) {
          handleUnauthorized()
          return
        }
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      })
      .finally(() => setLoading(false))
  }, [debouncedKeyword, page, handleUnauthorized])

  useEffect(() => {
    if (!getAdminPassword()) {
      navigate('/admin/login', { replace: true })
      return
    }
    load()
  }, [load, navigate])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 2500)
    return () => clearTimeout(t)
  }, [flash])

  return (
    <AdminLayout>
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
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="이름 또는 이메일로 검색"
        />
        {keyword && (
          <button type="button" className="search-clear" onClick={() => setKeyword('')}>✕</button>
        )}
      </div>

      {flash && <div className="flash">{flash}</div>}
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
                {data.content.map((m) => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>{m.name ?? '-'}</td>
                    <td className="ellipsis">{m.email || '-'}</td>
                    <td className="center">{m.socialType ? SOCIAL_LABEL[m.socialType] ?? m.socialType : '-'}</td>
                    <td className="center">{m.pushDeviceCount > 0 ? `${m.pushDeviceCount}대` : '없음'}</td>
                    <td className="date">{m.createDate?.slice(0, 10)}</td>
                    <td className="center">
                      <button
                        type="button"
                        className="push-btn"
                        disabled={m.pushDeviceCount === 0}
                        title={m.pushDeviceCount === 0 ? '앱에 로그인해 알림을 등록한 기기가 없어요' : undefined}
                        onClick={() => {
                          setFlash(null)
                          setTarget(m)
                        }}
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

      {target && (
        <AdminMemberPushModal
          member={target}
          onClose={() => setTarget(null)}
          onSent={(sent) => {
            setFlash(`${target.name ?? `#${target.id}`}님의 기기 ${sent}대에 보냈어요.`)
            setTarget(null)
            load()
          }}
          onUnauthorized={handleUnauthorized}
        />
      )}
    </div>
    </AdminLayout>
  )
}
