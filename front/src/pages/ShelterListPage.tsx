import { useEffect, useState } from 'react'
import { fetchShelters } from '../api/shelterApi'
import type { PageResponse, Shelter } from '../types/shelter'
import './ShelterListPage.css'

const PAGE_SIZE = 20

function yn(value: boolean | null): string {
  if (value === null || value === undefined) return '-'
  return value ? 'O' : 'X'
}

export default function ShelterListPage() {
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<Shelter> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchShelters(page, PAGE_SIZE)
      .then(setData)
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : '알 수 없는 오류'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="shelter-page">
      <header className="shelter-header">
        <h1>대피소 목록</h1>
        <p className="shelter-subtitle">
          총 {data?.totalElements ?? 0}건 · 페이지 {(data?.page ?? 0) + 1} / {data?.totalPages ?? 0}
        </p>
      </header>

      {loading && <div className="shelter-state">불러오는 중…</div>}
      {error && <div className="shelter-state shelter-error">{error}</div>}

      {data && !loading && !error && (
        <>
          <div className="shelter-table-wrap">
            <table className="shelter-table">
              <thead>
                <tr>
                  <th>ID</th>
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
                  <tr key={s.id}>
                    <td>{s.id}</td>
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
                    <td colSpan={12} className="center">데이터가 없습니다</td>
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
