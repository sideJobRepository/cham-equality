import './Pagination.css'

type Props = {
  // 0부터 시작하는 현재 페이지(서버 PageResponse.page와 같은 기준)
  page: number
  totalPages: number
  onChange: (nextPage: number) => void
}

/** 관리자 목록 공통 페이지 이동(««, «, 현재/전체, », »»). 한 페이지뿐이면 그리지 않는다. */
export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null

  const lastPage = totalPages - 1
  const isFirst = page <= 0
  const isLast = page >= lastPage

  return (
    <nav className="admin-pagination" aria-label="페이지 이동">
      <button type="button" aria-label="첫 페이지" disabled={isFirst} onClick={() => onChange(0)}>
        ««
      </button>
      <button type="button" aria-label="이전 페이지" disabled={isFirst} onClick={() => onChange(page - 1)}>
        «
      </button>
      <span aria-current="page">
        {page + 1} / {totalPages}
      </span>
      <button type="button" aria-label="다음 페이지" disabled={isLast} onClick={() => onChange(page + 1)}>
        »
      </button>
      <button type="button" aria-label="마지막 페이지" disabled={isLast} onClick={() => onChange(lastPage)}>
        »»
      </button>
    </nav>
  )
}
