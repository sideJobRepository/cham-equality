import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * 관리자 목록의 필터·페이지·검색어를 URL 쿼리(`filter`, `page`, `q`)에 둔다.
 * 새로고침·뒤로가기·링크 공유 때 보던 화면이 그대로 남게 하려는 것.
 *
 * 규칙
 * - 기본값은 URL에서 지운다(첫 페이지·기본 필터·빈 검색어면 쿼리가 붙지 않는다).
 * - 잘못된 값(모르는 필터, 숫자가 아닌 페이지, 0 이하 페이지)은 기본값으로 읽는다. URL을 고쳐 쓰지는 않는다.
 * - URL의 `page`는 사람이 읽는 1부터, 코드의 page는 서버 PageResponse와 같은 0부터다.
 * - 필터·검색어가 바뀌면 첫 페이지로 돌아간다(`page`를 지운다).
 */

const PAGE_PARAM = 'page'
const FILTER_PARAM = 'filter'
const QUERY_PARAM = 'q'

const SEARCH_DEBOUNCE_MS = 300

/**
 * 필터가 걸린 목록 화면 경로. 대시보드 카드처럼 다른 화면에서 특정 필터로 목록을 열 때 쓴다.
 * 기본 필터라도 쿼리에 그대로 적는다 — 목록 화면의 기본값이 바뀌어도 링크가 뜻하는 필터는 유지된다.
 */
export function buildFilteredListPath(listPath: string, filter: string): string {
  const params = new URLSearchParams({ [FILTER_PARAM]: filter })
  return `${listPath}?${params.toString()}`
}

/** URL의 1부터 시작하는 page를 0부터로 바꾼다. 잘못된 값이면 0(첫 페이지). */
function parsePage(rawPage: string | null): number {
  if (rawPage === null || !/^\d+$/.test(rawPage)) return 0
  const pageNumber = Number(rawPage)
  return Number.isSafeInteger(pageNumber) && pageNumber >= 1 ? pageNumber - 1 : 0
}

/** 0부터 시작하는 현재 페이지. 페이지 이동은 히스토리에 남겨 뒤로가기로 돌아갈 수 있게 한다. */
export function useUrlPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get(PAGE_PARAM))

  const setPage = useCallback(
    (nextPage: number) => {
      setSearchParams((previousParams) => {
        const nextParams = new URLSearchParams(previousParams)
        if (nextPage <= 0) nextParams.delete(PAGE_PARAM)
        else nextParams.set(PAGE_PARAM, String(nextPage + 1))
        return nextParams
      })
    },
    [setSearchParams],
  )

  return { page, setPage }
}

/**
 * 허용 목록 안의 필터 값. 바꾸면 첫 페이지로 돌아간다.
 * filterValues는 모듈 상수 배열을 넘긴다(참조가 매번 바뀌면 setFilter도 매번 새로 만들어진다).
 */
export function useUrlFilter<Filter extends string>(filterValues: readonly Filter[], defaultFilter: Filter) {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawFilter = searchParams.get(FILTER_PARAM)
  const filter = filterValues.find((filterValue) => filterValue === rawFilter) ?? defaultFilter

  const setFilter = useCallback(
    (nextFilter: Filter) => {
      setSearchParams((previousParams) => {
        const nextParams = new URLSearchParams(previousParams)
        if (nextFilter === defaultFilter) nextParams.delete(FILTER_PARAM)
        else nextParams.set(FILTER_PARAM, nextFilter)
        nextParams.delete(PAGE_PARAM)
        return nextParams
      })
    },
    [setSearchParams, defaultFilter],
  )

  return { filter, setFilter }
}

/**
 * 검색창 입력값(keywordInput)과 실제 요청에 쓰는 검색어(query = URL의 q)를 나눠 둔다.
 *
 * 루프가 생기지 않게 하는 방법
 * - 입력 → URL: 입력이 멈추고 300ms 뒤, 다듬은 값이 지금 URL의 q와 다를 때만 URL을 바꾼다.
 *   같으면 아무것도 하지 않으니 URL → 입력으로 되돌아온 값이 다시 URL을 쓰는 일이 없다.
 * - URL → 입력: 뒤로가기처럼 밖에서 q가 바뀐 경우에만 입력창을 q로 맞춘다.
 *   직접 쓴 q는 syncedQuery에 함께 기록해 두므로 "밖에서 바뀜"으로 보지 않는다.
 *   (그렇지 않으면 "대전 " 처럼 끝에 공백을 친 순간 다듬은 q로 입력창이 덮여 공백이 사라진다)
 * - 입력창 맞추기는 effect가 아니라 렌더 중 상태 조정으로 한다(react-hooks/set-state-in-effect 회피).
 * 입력은 replace로 기록해 글자마다 히스토리가 쌓이지 않게 한다.
 */
export function useUrlSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get(QUERY_PARAM) ?? ''

  const [keywordInput, setKeywordInput] = useState(query)
  const [syncedQuery, setSyncedQuery] = useState(query)

  if (query !== syncedQuery) {
    setSyncedQuery(query)
    setKeywordInput(query)
  }

  useEffect(() => {
    const nextQuery = keywordInput.trim()
    if (nextQuery === query) return
    const debounceTimer = setTimeout(() => {
      setSyncedQuery(nextQuery)
      setSearchParams(
        (previousParams) => {
          const nextParams = new URLSearchParams(previousParams)
          if (nextQuery === '') nextParams.delete(QUERY_PARAM)
          else nextParams.set(QUERY_PARAM, nextQuery)
          nextParams.delete(PAGE_PARAM)
          return nextParams
        },
        { replace: true },
      )
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(debounceTimer)
  }, [keywordInput, query, setSearchParams])

  return { keywordInput, setKeywordInput, query }
}
