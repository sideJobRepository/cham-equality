import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  clearAdminPassword,
  fetchAdminShelters,
  getAdminPassword,
  UnauthorizedError,
} from '../api/adminApi'
import AdminShelterEditModal from '../components/AdminShelterEditModal'
import { SHELTER_TYPE_LABEL, type PageResponse, type Shelter } from '../types/shelter'
import './AdminSheltersPage.css'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export default function AdminSheltersPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<Shelter> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Shelter | null>(null)
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
    fetchAdminShelters(page, PAGE_SIZE, debouncedKeyword)
      .then(setData)
      .catch((e: unknown) => {
        if (e instanceof UnauthorizedError) {
          handleUnauthorized()
          return
        }
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      })
      .finally(() => setLoading(false))
  }, [page, debouncedKeyword, handleUnauthorized])

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

  const logout = () => {
    clearAdminPassword()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shelters-page">
      <header className="admin-header">
        <div>
          <h1>관리자 · 대피소 편집</h1>
          <p className="subtitle">시설명 / 건축년도 / 대피소 타입을 직접 수정합니다.</p>
        </div>
        <div className="admin-header-actions">
          <Link to="/admin/reports" className="shelter-link-btn">← 리포트 검토</Link>
          <Link to="/shelters" className="shelter-link-btn">대피소 목록</Link>
          <button type="button" className="logout-btn" onClick={logout}>로그아웃</button>
        </div>
      </header>

      <div className="search-bar">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="시설명, 도로명, 구주소로 검색"
        />
        {keyword && (
          <button type="button" className="search-clear" onClick={() => setKeyword('')}>✕</button>
        )}
      </div>

      {flash && <div className="shelter-flash">{flash}</div>}
      {loading && <div className="state">불러오는 중…</div>}
      {error && <div className="state error">{error}</div>}

      {data && !loading && !error && (
        <>
          <div className="shelters-table-wrap">
            <table className="shelters-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>시설명</th>
                  <th>타입</th>
                  <th>건축 연도</th>
                  <th>주소</th>
                  <th>구주소</th>
                  <th>관리기관</th>
                  <th>편집</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td className="ellipsis">{s.name}</td>
                    <td className="ellipsis">{s.shelterType ? SHELTER_TYPE_LABEL[s.shelterType] : '-'}</td>
                    <td className="num">{s.builtYear ?? '-'}</td>
                    <td className="ellipsis">{s.address}</td>
                    <td className="ellipsis">{s.oldAddress ?? '-'}</td>
                    <td className="ellipsis">{s.managingAuthorityName ?? '-'}</td>
                    <td>
                      <button type="button" className="edit-btn" onClick={() => setEditing(s)}>편집</button>
                    </td>
                  </tr>
                ))}
                {data.empty && (
                  <tr>
                    <td colSpan={8} className="center">
                      {debouncedKeyword ? '검색 결과가 없습니다' : '데이터가 없습니다'}
                    </td>
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

      {editing && (
        <AdminShelterEditModal
          shelter={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            setFlash('수정되었습니다')
            load()
          }}
          onUnauthorized={handleUnauthorized}
        />
      )}
    </div>
  )
}
