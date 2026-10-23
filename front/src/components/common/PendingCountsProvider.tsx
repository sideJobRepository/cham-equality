import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import {
  PendingCountsContext,
  type PendingCounts,
  type PendingCountsApi,
} from '@/components/common/pendingCountsContext'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import { PENDING_COUNT_SOURCES } from '@/lib/pendingCounts'

type Settled = {
  /** 이 결과를 만든 요청의 키. 지금 키와 다르면 새 요청이 진행 중이라는 뜻이다. */
  requestKey: string
  counts: PendingCounts
  failed: boolean
}

const EMPTY_COUNTS: PendingCounts = { webReports: null, appReports: null, feedbacks: null }

type Props = {
  children: ReactNode
}

/**
 * 대기 건수(웹 제보·앱 제보 대기, 새 피드백)를 관리자 화면 전체에서 한 번만 불러와 나눠 쓴다.
 *
 * - 처음 들어올 때, 메뉴를 옮길 때(pathname 변경), refreshCounts()를 부를 때 다시 불러온다.
 *   같은 화면 안의 필터·페이지 이동(쿼리 변경)으로는 다시 부르지 않는다.
 * - 건수마다 따로 요청해 하나가 실패해도 나머지는 보인다. 실패한 건수는 null로 둔다(옛 숫자를 남기면 틀린 값을 믿게 된다).
 * - usePagedList와 같은 방식으로 요청 순번을 매겨 늦게 온 이전 응답을 버리고,
 *   loading은 effect 안 setState 대신 "마지막 결과가 지금 요청의 것인가"로 계산한다.
 * - 401은 useAdminRequest가 로그인 화면으로 보낸다(이 Provider도 함께 사라진다).
 */
export default function PendingCountsProvider({ children }: Props) {
  const { run } = useAdminRequest()
  const { pathname } = useLocation()
  const [reloadToken, setReloadToken] = useState(0)
  const [settled, setSettled] = useState<Settled | null>(null)
  const latestRequestIdRef = useRef(0)

  const requestKey = `${pathname}#${reloadToken}`

  useEffect(() => {
    latestRequestIdRef.current += 1
    const requestId = latestRequestIdRef.current
    Promise.all(
      PENDING_COUNT_SOURCES.map((source) => run(source.fetchTotal(), '건수를 불러오지 못했습니다')),
    ).then((results) => {
      if (requestId !== latestRequestIdRef.current) return
      const nextCounts: PendingCounts = { ...EMPTY_COUNTS }
      let anyFailed = false
      PENDING_COUNT_SOURCES.forEach((source, sourceIndex) => {
        const result = results[sourceIndex]
        if (result.ok) nextCounts[source.key] = result.data
        else anyFailed = true
      })
      setSettled({ requestKey, counts: nextCounts, failed: anyFailed })
    })
  }, [requestKey, run])

  // 화면을 떠난 뒤 도착한 응답은 무시한다(순번을 올려 두면 위 비교에서 걸러진다).
  useEffect(() => {
    return () => {
      latestRequestIdRef.current += 1
    }
  }, [])

  const refreshCounts = useCallback(() => {
    setReloadToken((previousToken) => previousToken + 1)
  }, [])

  const loading = settled === null || settled.requestKey !== requestKey

  const pendingCountsApi = useMemo<PendingCountsApi>(
    () => ({
      counts: settled ? settled.counts : EMPTY_COUNTS,
      loading,
      failed: !loading && settled !== null && settled.failed,
      refreshCounts,
    }),
    [settled, loading, refreshCounts],
  )

  return (
    <PendingCountsContext.Provider value={pendingCountsApi}>{children}</PendingCountsContext.Provider>
  )
}
