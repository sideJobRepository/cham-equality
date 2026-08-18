import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  bulkCreateAdminShelters,
  clearAdminPassword,
  errorMessage,
  fetchAdminShelters,
  getAdminPassword,
  UnauthorizedError,
} from '@/api/adminApi'
import AdminLayout from '@/components/AdminLayout'
import AdminShelterCreateModal from '@/components/AdminShelterCreateModal'
import AdminShelterEditModal from '@/components/AdminShelterEditModal'
import { SHELTER_TYPE_LABEL, type PageResponse, type Shelter } from '@/types/shelter'
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
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 엑셀 한 개를 그대로 서버에 넘겨 대량 등록한다. 파싱·검증은 전부 서버(ExcelMapper)가 담당.
  const handleExcelSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // 같은 파일을 다시 골라도 change가 발생하도록 값을 비운다.
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setUploadError(null)
    try {
      const ids = await bulkCreateAdminShelters(file)
      setFlash(`${ids.length}건의 대피소가 추가되었습니다`)
      load()
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) {
        handleUnauthorized()
        return
      }
      setUploadError(errorMessage(err, '엑셀 업로드에 실패했습니다'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <AdminLayout>
    <div className="admin-shelters-page">
      <header className="admin-header">
        <div>
          <h1>대피소 편집</h1>
          <p className="subtitle">시설명 / 건축년도 / 대피소 타입을 직접 수정합니다.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="add-btn" onClick={() => setCreating(true)}>
            + 대피소 추가
          </button>
          <button
            type="button"
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '업로드 중…' : '엑셀 업로드'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="excel-input"
            onChange={handleExcelSelected}
          />
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
      {uploadError && <div className="shelter-flash error">{uploadError}</div>}
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

      {creating && (
        <AdminShelterCreateModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false)
            setFlash('대피소가 추가되었습니다')
            load()
          }}
          onUnauthorized={handleUnauthorized}
        />
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
    </AdminLayout>
  )
}
