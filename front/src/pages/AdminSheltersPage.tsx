import { useCallback, useEffect, useRef, useState } from 'react'
import { bulkCreateAdminShelters, fetchAdminShelters } from '@/api/adminApi'
import AdminShelterCreateModal from '@/components/AdminShelterCreateModal'
import AdminShelterEditModal from '@/components/AdminShelterEditModal'
import Pagination from '@/components/common/Pagination'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import { useFeedback } from '@/hooks/useFeedback'
import { SHELTER_TYPE_LABEL, type PageResponse, type Shelter } from '@/types/shelter'
import './AdminSheltersPage.css'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export default function AdminSheltersPage() {
  const { run } = useAdminRequest()
  const { toast } = useFeedback()
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<Shelter> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Shelter | null>(null)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedKeyword(keyword)
      setPage(0)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(debounceTimer)
  }, [keyword])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await run(fetchAdminShelters(page, PAGE_SIZE, debouncedKeyword), '목록을 불러오지 못했습니다')
    if (result.ok) setData(result.data)
    else if (result.message) setError(result.message)
    setLoading(false)
  }, [page, debouncedKeyword, run])

  useEffect(() => {
    load()
  }, [load])

  // 엑셀 한 개를 그대로 서버에 넘겨 대량 등록한다. 파싱·검증은 전부 서버(ExcelMapper)가 담당.
  const handleExcelSelected = async (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const file = changeEvent.target.files?.[0]
    // 같은 파일을 다시 골라도 change가 발생하도록 값을 비운다.
    changeEvent.target.value = ''
    if (!file) return

    setUploading(true)
    const result = await run(bulkCreateAdminShelters(file), '엑셀 업로드에 실패했습니다')
    setUploading(false)
    if (result.ok) {
      toast(`${result.data.length}건의 대피소가 추가되었습니다`)
      load()
    } else if (result.message) {
      toast(result.message, 'error')
    }
  }

  return (
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
          onChange={(changeEvent) => setKeyword(changeEvent.target.value)}
          placeholder="시설명, 도로명, 구주소로 검색"
        />
        {keyword && (
          <button type="button" className="search-clear" onClick={() => setKeyword('')}>✕</button>
        )}
      </div>

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
                {data.content.map((shelter) => (
                  <tr key={shelter.id}>
                    <td>{shelter.id}</td>
                    <td className="ellipsis">{shelter.name}</td>
                    <td className="ellipsis">{shelter.shelterType ? SHELTER_TYPE_LABEL[shelter.shelterType] : '-'}</td>
                    <td className="num">{shelter.builtYear ?? '-'}</td>
                    <td className="ellipsis">{shelter.address}</td>
                    <td className="ellipsis">{shelter.oldAddress ?? '-'}</td>
                    <td className="ellipsis">{shelter.managingAuthorityName ?? '-'}</td>
                    <td>
                      <button type="button" className="edit-btn" onClick={() => setEditing(shelter)}>편집</button>
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

          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      {creating && (
        <AdminShelterCreateModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false)
            toast('대피소가 추가되었습니다')
            load()
          }}
        />
      )}

      {editing && (
        <AdminShelterEditModal
          shelter={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            toast('수정되었습니다')
            load()
          }}
        />
      )}
    </div>
  )
}
