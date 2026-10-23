import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import { useFeedback } from '@/hooks/useFeedback'
import type { PageResponse } from '@/types/shelter'

/** 연속 검토 대상 행. 웹 제보·앱 제보 목록 행이 둘 다 이 모양을 만족한다. */
type ReviewItem = {
  id: number
  requestStatus: string
}

type Options<Item extends ReviewItem> = {
  /** 지금 표에 보이는 목록(usePagedList의 data). 다시 불러오는 동안엔 직전 목록이다. */
  list: PageResponse<Item> | null
  /** URL 쿼리의 현재 페이지(0부터). */
  page: number
  setPage: (nextPage: number) => void
  /** 표를 같은 조건으로 다시 불러온다. */
  reload: () => void
  /** 현재 필터 그대로 특정 페이지를 불러온다. 페이지 밖의 이전/다음 건과 다음 대기 건을 찾을 때 쓴다. */
  fetchPageAt: (targetPage: number) => Promise<PageResponse<Item>>
}

export type ReviewNavigation = {
  selectedId: number | null
  /** 이전/다음 건·다음 대기 건을 찾는 중. 모달 버튼을 잠그는 데 쓴다. */
  navigating: boolean
  hasPrevious: boolean
  hasNext: boolean
  open: (reportId: number) => void
  close: () => void
  goPrevious: () => void
  goNext: () => void
  /**
   * 승인·반려가 끝난 뒤 처리한 건의 id로 호출한다. 목록을 다시 불러오고 다음 대기 건을 연다. 없으면 모달을 닫고 알린다.
   * 처리 중에 모달이 닫혔으면 목록만 다시 불러온다.
   */
  openNextPending: (actedId: number) => void
}

const PENDING_STATUS = 'PENDING'

// 전체·반려 같은 필터에서 대기 건이 드문드문 있으면 뒤 페이지를 계속 넘겨 봐야 한다.
// 서버를 과하게 두드리지 않도록 처리한 페이지 포함 이만큼만 살펴본다.
const MAX_SCAN_PAGES = 5

/**
 * 제보 상세 모달의 연속 검토(이전/다음, 승인·반려 뒤 다음 대기 건) 공통 훅.
 *
 * 다음 대기 건을 고르는 규칙
 * - 목록은 서버에서 접수일 내림차순이다. "다음"은 표에서 처리한 건보다 아래(더 오래된) 쪽이다.
 * - 처리 직후 같은 페이지를 서버에서 새로 받아, 처리한 건과 그보다 위에 있던 건을 빼고
 *   상태가 아직 대기인 첫 건을 연다. 대기 필터에선 처리한 건이 목록에서 빠지며 뒤 페이지 첫 건이
 *   이 페이지 끝으로 당겨 올라오는데, 새로 받은 페이지를 보므로 그 건을 놓치지 않는다.
 *   같은 대피소의 다른 대기 건이 서버에서 자동 반려된 경우도 상태 검사로 걸러진다.
 * - 이 페이지에 없으면 다음 페이지로 넘어가며 찾는다(MAX_SCAN_PAGES까지).
 * - 끝까지 없으면 모달을 닫고 토스트로 알린다. 처리한 건이 페이지의 유일한 건이라 페이지가
 *   비었으면 마지막 유효 페이지로 옮겨 빈 표가 남지 않게 한다.
 *
 * 경합 방지: 열기·닫기·이동마다 선택 순번을 올리고, 비동기로 찾은 결과는 순번이 그대로일 때만 반영한다.
 * 찾는 사이 사용자가 모달을 닫거나 다른 건을 열었으면 결과를 버린다.
 */
export function useReviewNavigation<Item extends ReviewItem>({
  list,
  page,
  setPage,
  reload,
  fetchPageAt,
}: Options<Item>): ReviewNavigation {
  const { run } = useAdminRequest()
  const { toast } = useFeedback()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [navigating, setNavigating] = useState(false)
  const selectionTokenRef = useRef(0)
  // 승인·반려 요청이 도는 사이 모달을 닫았는지 알려고 지금 선택을 렌더와 무관하게 들고 있는다.
  // (모달의 onActionDone은 닫히기 전 렌더의 선택값을 붙잡고 있어서 state로는 알 수 없다)
  const selectedIdRef = useRef<number | null>(null)

  // 화면을 떠난 뒤 도착한 결과로 모달을 다시 열지 않게 순번을 올려 둔다.
  useEffect(() => {
    return () => {
      selectionTokenRef.current += 1
    }
  }, [])

  const select = useCallback((reportId: number | null) => {
    selectionTokenRef.current += 1
    selectedIdRef.current = reportId
    setNavigating(false)
    setSelectedId(reportId)
  }, [])

  const open = useCallback((reportId: number) => select(reportId), [select])
  const close = useCallback(() => select(null), [select])

  const items = useMemo(() => (list ? list.content : []), [list])
  const selectedIndex = selectedId === null ? -1 : items.findIndex((item) => item.id === selectedId)
  const listPage = list ? list.page : page
  const listTotalPages = list ? list.totalPages : 0
  // 선택한 건이 지금 표에 없으면(다른 페이지로 넘어가 새 목록을 기다리는 중 등) 이동 버튼을 잠근다.
  const hasPrevious = selectedIndex > 0 || (selectedIndex === 0 && listPage > 0)
  const hasNext =
    (selectedIndex >= 0 && selectedIndex < items.length - 1) ||
    (selectedIndex >= 0 && selectedIndex === items.length - 1 && listPage < listTotalPages - 1)

  /** 이웃 페이지를 받아 그 페이지의 첫 건(다음) 또는 마지막 건(이전)을 연다. */
  const openAcrossPage = useCallback(
    async (targetPage: number, edge: 'first' | 'last') => {
      selectionTokenRef.current += 1
      const token = selectionTokenRef.current
      setNavigating(true)
      const result = await run(fetchPageAt(targetPage), '목록을 불러오지 못했습니다')
      if (token !== selectionTokenRef.current) return
      setNavigating(false)
      if (!result.ok) {
        if (result.message) toast(result.message, 'error')
        return
      }
      const targetItems = result.data.content
      const targetItem = edge === 'first' ? targetItems[0] : targetItems[targetItems.length - 1]
      if (!targetItem) {
        toast(edge === 'first' ? '다음 건이 없습니다' : '이전 건이 없습니다', 'info')
        return
      }
      setPage(targetPage)
      select(targetItem.id)
    },
    [run, fetchPageAt, toast, setPage, select],
  )

  const goPrevious = useCallback(() => {
    if (!hasPrevious) return
    if (selectedIndex > 0) {
      select(items[selectedIndex - 1].id)
      return
    }
    void openAcrossPage(listPage - 1, 'last')
  }, [hasPrevious, selectedIndex, items, listPage, select, openAcrossPage])

  const goNext = useCallback(() => {
    if (!hasNext) return
    if (selectedIndex < items.length - 1) {
      select(items[selectedIndex + 1].id)
      return
    }
    void openAcrossPage(listPage + 1, 'first')
  }, [hasNext, selectedIndex, items, listPage, select, openAcrossPage])

  const openNextPending = useCallback(
    (actedId: number) => {
      // 처리하는 동안 사용자가 모달을 닫았거나 다른 건으로 옮겼으면 다음 건을 열지 않고 표만 갱신한다.
      if (selectedIdRef.current !== actedId) {
        reload()
        return
      }
      // 처리 시점 표 기준으로 "처리한 건보다 위에 있던 건"을 기억해 둔다(다음 후보에서 뺀다).
      const actedIndex = items.findIndex((item) => item.id === actedId)
      const precedingIds = new Set(
        actedIndex > 0 ? items.slice(0, actedIndex).map((item) => item.id) : [],
      )
      const startPage = listPage

      selectionTokenRef.current += 1
      const token = selectionTokenRef.current
      setNavigating(true)
      // 표는 표대로 새로 불러온다(처리한 건의 상태 배지 갱신·대기 필터에서 빠짐).
      reload()

      const scan = async () => {
        let lastTotalPages = 0
        for (let scanPage = startPage; scanPage < startPage + MAX_SCAN_PAGES; scanPage += 1) {
          const result = await run(fetchPageAt(scanPage), '다음 대기 건을 찾지 못했습니다')
          if (token !== selectionTokenRef.current) return
          if (!result.ok) {
            // 처리 자체는 끝났으니 모달은 닫고, 찾기 실패만 알린다.
            select(null)
            if (result.message) toast(result.message, 'error')
            return
          }
          const scanned = result.data
          lastTotalPages = scanned.totalPages
          const candidate = scanned.content.find(
            (item) =>
              item.requestStatus === PENDING_STATUS &&
              item.id !== actedId &&
              !precedingIds.has(item.id),
          )
          if (candidate) {
            if (scanPage !== startPage) setPage(scanPage)
            select(candidate.id)
            return
          }
          if (scanPage === startPage && scanned.content.length === 0 && startPage > 0) {
            // 처리한 건이 이 페이지의 유일한 건이었다. 빈 페이지가 남지 않게 마지막 유효 페이지로 옮긴다.
            setPage(Math.max(0, scanned.totalPages - 1))
            break
          }
          if (scanned.last || scanPage >= scanned.totalPages - 1) break
        }
        select(null)
        const scannedToLimit = startPage + MAX_SCAN_PAGES < lastTotalPages
        toast(
          scannedToLimit
            ? `다음 ${MAX_SCAN_PAGES}페이지 안에 대기 건이 없습니다`
            : '다음 대기 건이 없습니다',
          'info',
        )
      }
      void scan()
    },
    [items, listPage, reload, run, fetchPageAt, toast, setPage, select],
  )

  return {
    selectedId,
    navigating,
    hasPrevious,
    hasNext,
    open,
    close,
    goPrevious,
    goNext,
    openNextPending,
  }
}
