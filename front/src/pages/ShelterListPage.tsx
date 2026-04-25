import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchShelters, type ShelterSearchFilter } from '../api/shelterApi'
import { getAdminPassword } from '../api/adminApi'
import ShelterReportModal from '../components/ShelterReportModal'
import PendingReportsListModal from '../components/PendingReportsListModal'
import ShelterInfoViewModal from '../components/ShelterInfoViewModal'
import { SHELTER_TYPE_LABEL, type PageResponse, type Shelter } from '../types/shelter'
import './ShelterListPage.css'

const PAGE_SIZE = 20

const FILTER_OPTIONS: { value: '' | ShelterSearchFilter; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'SUBMITTED', label: '제출됨' },
  { value: 'COMPLETED', label: '완료됨' },
  { value: 'NOT_SUBMITTED', label: '미제출' },
  { value: 'RE_INVESTIGATION', label: '재조사' },
]

function yn(value: boolean | null): string {
  if (value === null || value === undefined) return '-'
  return value ? 'O' : 'X'
}

type ReportModalState =
  | { mode: 'create'; shelter: Shelter }
  | { mode: 'edit'; shelter: Shelter; reportId: number }

export default function ShelterListPage() {
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const [filter, setFilter] = useState<'' | ShelterSearchFilter>('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<Shelter> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportModal, setReportModal] = useState<ReportModalState | null>(null)
  const [pendingList, setPendingList] = useState<Shelter | null>(null)
  const [infoView, setInfoView] = useState<Shelter | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchShelters(page, PAGE_SIZE, submittedKeyword, filter || undefined)
      .then(setData)
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : '알 수 없는 오류'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [page, submittedKeyword, filter])

  useEffect(() => {
    load()
  }, [load])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setSubmittedKeyword(keyword.trim())
  }

  const handleFilterChange = (value: '' | ShelterSearchFilter) => {
    setFilter(value)
    setPage(0)
  }

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 2500)
    return () => clearTimeout(t)
  }, [flash])

  const handleRowClick = (s: Shelter) => {
    if (s.surveyStatus === 'INVESTIGATED') {
      setInfoView(s)
      return
    }
    setReportModal({ mode: 'create', shelter: s })
  }

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

      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <div className="search-input-wrap">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="시설명, 도로명, 구주소로 검색 (Enter)"
          />
          {keyword && (
            <button
              type="button"
              className="search-clear"
              onClick={() => {
                setKeyword('')
                setSubmittedKeyword('')
                setPage(0)
              }}
            >
              ✕
            </button>
          )}
        </div>
        <select
          className="status-filter"
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as '' | ShelterSearchFilter)}
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || 'ALL'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button type="submit" className="search-submit">검색</button>
      </form>

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
                  <th>타입</th>
                  <th>주소</th>
                  <th>장애인화장실</th>
                  <th>경사로</th>
                  <th>엘베</th>
                  <th>점자블록</th>
                  <th>안내문 언어</th>
                  <th>면적(㎡)</th>
                  <th>수용인원</th>
                  <th>관리기관</th>
                  <th>전화번호</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((s) => (
                  <tr
                    key={s.id}
                    className={`clickable ${s.surveyStatus === 'INVESTIGATED' ? 'row-locked' : ''}`}
                    onClick={() => handleRowClick(s)}
                  >
                    <td>{s.id}</td>
                    <td className="center">
                      {s.surveyStatus === 'INVESTIGATED' ? (
                        <span className="badge badge-locked" title="조사 완료">완료</span>
                      ) : s.surveyStatus === 'RE_INVESTIGATION' ? (
                        <span className="badge badge-reinvestigation" title="재조사 중">재조사</span>
                      ) : s.pendingReportCount > 0 ? (
                        <button
                          type="button"
                          className="badge badge-pending badge-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPendingList(s)
                          }}
                          title="제출된 내용 보기/수정"
                        >
                          제출됨{s.pendingReportCount > 1 ? ` ${s.pendingReportCount}` : ''}
                        </button>
                      ) : (
                        <span className="badge badge-empty">-</span>
                      )}
                    </td>
                    <td className="ellipsis">{s.name}</td>
                    <td className="ellipsis">{s.shelterType ? SHELTER_TYPE_LABEL[s.shelterType] : '-'}</td>
                    <td className="ellipsis">
                      <div>{s.address}</div>
                      {s.oldAddress && <div className="sub-address">{s.oldAddress}</div>}
                    </td>
                    <td className="center">{yn(s.accessibleToilet)}</td>
                    <td className="center">{yn(s.ramp)}</td>
                    <td className="center">{yn(s.elevator)}</td>
                    <td className="center">{yn(s.brailleBlock)}</td>
                    <td className="ellipsis">{s.signageLanguage ?? '-'}</td>
                    <td className="num">{s.area ?? '-'}</td>
                    <td className="num">{s.capacity ?? '-'}</td>
                    <td className="ellipsis">{s.managingAuthorityName ?? '-'}</td>
                    <td>{s.managingAuthorityTelNo ?? '-'}</td>
                  </tr>
                ))}
                {data.empty && (
                  <tr>
                    <td colSpan={14} className="center">
                      {submittedKeyword || filter ? '검색 결과가 없습니다' : '데이터가 없습니다'}
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

      {pendingList && (
        <PendingReportsListModal
          shelter={pendingList}
          onClose={() => setPendingList(null)}
          onSelect={(reportId) => {
            const shelter = pendingList
            setPendingList(null)
            setReportModal({ mode: 'edit', shelter, reportId })
          }}
        />
      )}

      {infoView && (
        <ShelterInfoViewModal
          shelter={infoView}
          onClose={() => setInfoView(null)}
        />
      )}

      {reportModal && (
        <ShelterReportModal
          shelter={reportModal.shelter}
          reportId={reportModal.mode === 'edit' ? reportModal.reportId : undefined}
          onClose={() => setReportModal(null)}
          onSubmitted={(msg) => {
            setReportModal(null)
            setFlash(msg)
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
