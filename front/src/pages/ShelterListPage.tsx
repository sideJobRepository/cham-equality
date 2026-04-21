import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchShelters } from '../api/shelterApi'
import { getAdminPassword } from '../api/adminApi'
import ShelterReportModal from '../components/ShelterReportModal'
import type { PageResponse, Shelter } from '../types/shelter'
import './ShelterListPage.css'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

function yn(value: boolean | null): string {
  if (value === null || value === undefined) return '-'
  return value ? 'O' : 'X'
}

export default function ShelterListPage() {
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<Shelter> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Shelter | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

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
    fetchShelters(page, PAGE_SIZE, debouncedKeyword)
      .then(setData)
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : '알 수 없는 오류'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [page, debouncedKeyword])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 2500)
    return () => clearTimeout(t)
  }, [flash])

  return (
    <div className="shelter-page">
      <header className="shelter-header">
        <div>
          <h1>대피소 목록</h1>
          <p className="shelter-subtitle">
            총 {data?.totalElements ?? 0}건 · 페이지 {(data?.page ?? 0) + 1} / {data?.totalPages ?? 0}
          </p>
        </div>
        <Link
          to={getAdminPassword() ? '/admin/reports' : '/admin/login'}
          className="admin-link-btn"
        >
          관리자
        </Link>
      </header>

      <div className="search-bar">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="시설명 또는 주소로 검색"
        />
        {keyword && (
          <button type="button" className="search-clear" onClick={() => setKeyword('')}>
            ✕
          </button>
        )}
      </div>

      {flash && <div className="shelter-flash">{flash}</div>}
      {loading && <div className="shelter-state">불러오는 중…</div>}
      {error && <div className="shelter-state shelter-error">{error}</div>}

      {data && !loading && !error && (
        <>
          <div className="shelter-table-wrap">
            <table className="shelter-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>상태</th>
                  <th>시설명</th>
                  <th>주소</th>
                  <th>면적(㎡)</th>
                  <th>수용인원</th>
                  <th>관리기관</th>
                  <th>전화번호</th>
                  <th>안내문 언어</th>
                  <th>장애인화장실</th>
                  <th>경사로</th>
                  <th>엘베</th>
                  <th>점자블록</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((s) => (
                  <tr key={s.id} className="clickable" onClick={() => setSelected(s)}>
                    <td>{s.id}</td>
                    <td className="center">
                      {s.pendingReportCount > 0 ? (
                        <span className="badge badge-pending">
                          제출됨{s.pendingReportCount > 1 ? ` ${s.pendingReportCount}` : ''}
                        </span>
                      ) : (
                        <span className="badge badge-empty">-</span>
                      )}
                    </td>
                    <td className="ellipsis">{s.name}</td>
                    <td className="ellipsis">{s.address}</td>
                    <td className="num">{s.area ?? '-'}</td>
                    <td className="num">{s.capacity ?? '-'}</td>
                    <td className="ellipsis">{s.managingAuthorityName ?? '-'}</td>
                    <td>{s.managingAuthorityTelNo ?? '-'}</td>
                    <td className="ellipsis">{s.signageLanguage ?? '-'}</td>
                    <td className="center">{yn(s.accessibleToilet)}</td>
                    <td className="center">{yn(s.ramp)}</td>
                    <td className="center">{yn(s.elevator)}</td>
                    <td className="center">{yn(s.brailleBlock)}</td>
                  </tr>
                ))}
                {data.empty && (
                  <tr>
                    <td colSpan={13} className="center">
                      {debouncedKeyword ? '검색 결과가 없습니다' : '데이터가 없습니다'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={setPage}
          />
        </>
      )}

      {selected && (
        <ShelterReportModal
          shelter={selected}
          onClose={() => setSelected(null)}
          onSubmitted={() => {
            setSelected(null)
            setFlash('조사 정보가 접수되었습니다 (승인 대기)')
            load()
          }}
        />
      )}
    </div>
  )
}

type PaginationProps = {
  page: number
  totalPages: number
  onChange: (next: number) => void
}

function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const BLOCK = 10
  const blockStart = Math.floor(page / BLOCK) * BLOCK
  const blockEnd = Math.min(blockStart + BLOCK, totalPages)
  const pages: number[] = []
  for (let i = blockStart; i < blockEnd; i++) pages.push(i)

  return (
    <nav className="shelter-pagination">
      <button disabled={page === 0} onClick={() => onChange(0)}>««</button>
      <button disabled={blockStart === 0} onClick={() => onChange(blockStart - 1)}>«</button>
      {pages.map((p) => (
        <button
          key={p}
          className={p === page ? 'active' : ''}
          onClick={() => onChange(p)}
        >
          {p + 1}
        </button>
      ))}
      <button disabled={blockEnd >= totalPages} onClick={() => onChange(blockEnd)}>»</button>
      <button disabled={page >= totalPages - 1} onClick={() => onChange(totalPages - 1)}>»»</button>
    </nav>
  )
}
