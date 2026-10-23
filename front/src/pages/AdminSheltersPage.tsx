import { useCallback, useRef, useState } from 'react'
import { bulkCreateAdminShelters, fetchAdminShelters } from '@/api/adminApi'
import AdminShelterCreateModal from '@/components/AdminShelterCreateModal'
import AdminShelterEditModal from '@/components/AdminShelterEditModal'
import Pagination from '@/components/common/Pagination'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import { useFeedback } from '@/hooks/useFeedback'
import { useUrlPage, useUrlSearch } from '@/hooks/useListQuery'
import { usePagedList } from '@/hooks/usePagedList'
import { SHELTER_TYPE_LABEL, type Shelter } from '@/types/shelter'
import './AdminSheltersPage.css'

const PAGE_SIZE = 20

export default function AdminSheltersPage() {
  const { run } = useAdminRequest()
  const { toast } = useFeedback()
  // 검색어(q)·페이지는 URL 쿼리에 둔다. 입력창 값과 요청 검색어의 디바운스·동기화는 useUrlSearch가 맡는다.
  const { keywordInput, setKeywordInput, query } = useUrlSearch()
  const { page, setPage } = useUrlPage()
  const [editing, setEditing] = useState<Shelter | null>(null)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 조건이 바뀌면 fetcher가 새로 만들어지고, usePagedList가 그걸 새 요청으로 보고 다시 불러온다.
  const fetchPage = useCallback(() => fetchAdminShelters(page, PAGE_SIZE, query), [page, query])
  const { data, loading, error, reload } = usePagedList(fetchPage)

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
      reload()
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
          value={keywordInput}
          onChange={(changeEvent) => setKeywordInput(changeEvent.target.value)}
          placeholder="시설명, 도로명, 구주소로 검색"
        />
        {keywordInput && (
          <button type="button" className="search-clear" aria-label="검색어 지우기" onClick={() => setKeywordInput('')}>✕</button>
        )}
      </div>

      {/* 처음 불러올 때만 문구를 띄우고, 이후엔 직전 표를 흐리게 남겨 깜빡임을 없앤다. */}
      {loading && !data && <div className="state">불러오는 중…</div>}
      {error && <div className="state error">{error}</div>}

      {data && !error && (
        <>
          <div className="shelters-table-wrap" aria-busy={loading}>
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
                      {query ? '검색 결과가 없습니다' : '데이터가 없습니다'}
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
            reload()
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
            reload()
          }}
        />
      )}
    </div>
  )
}
