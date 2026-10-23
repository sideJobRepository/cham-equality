import { useCallback, useEffect, useRef, useState } from 'react'
import { useAdminRequest } from '@/hooks/useAdminRequest'

type Settled<T> = {
  /** 이 결과를 만든 요청. 지금 fetcher·reloadToken과 다르면 새 요청이 진행 중이라는 뜻이다. */
  fetcher: () => Promise<T>
  reloadToken: number
  data: T | null
  error: string | null
}

export type PagedListState<T> = {
  /** 마지막으로 성공한 결과. 다시 불러오는 동안에도 직전 값을 그대로 들고 있다. */
  data: T | null
  loading: boolean
  error: string | null
  /** 같은 조건으로 다시 불러온다(승인·삭제 뒤 목록 갱신용). */
  reload: () => void
}

/**
 * 관리자 화면의 목록(또는 단건) 로딩 공통 훅.
 *
 * - fetcher는 호출부에서 `useCallback`으로 감싸 넘긴다. 필터·페이지·검색어가 바뀌면 fetcher가 새로 만들어지고,
 *   그게 곧 "새 요청" 신호다(deps를 따로 받지 않아서 exhaustive-deps 검사를 그대로 받는다).
 * - 요청마다 순번을 매기고, 응답이 왔을 때 가장 최근 요청이 아니면 버린다.
 *   페이지를 빠르게 넘길 때 늦게 온 이전 페이지 응답이 최신 결과를 덮지 않게 하려는 것.
 * - loading·error는 effect 안에서 setState로 켜지 않고 "마지막 결과가 지금 요청의 것인가"로 계산한다.
 *   effect 본문에서 동기 setState를 하지 않으니 react-hooks/set-state-in-effect에 걸리지 않는다.
 * - 401은 useAdminRequest가 이미 로그인 화면으로 보냈으므로 오류 문구 없이 끝낸다.
 */
export function usePagedList<T>(
  fetcher: () => Promise<T>,
  fallbackMessage = '목록을 불러오지 못했습니다',
): PagedListState<T> {
  const { run } = useAdminRequest()
  const [reloadToken, setReloadToken] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const latestRequestIdRef = useRef(0)

  useEffect(() => {
    latestRequestIdRef.current += 1
    const requestId = latestRequestIdRef.current
    run(fetcher(), fallbackMessage).then((result) => {
      if (requestId !== latestRequestIdRef.current) return
      setSettled((previous) => ({
        fetcher,
        reloadToken,
        data: result.ok ? result.data : previous ? previous.data : null,
        error: result.ok ? null : result.message,
      }))
    })
  }, [fetcher, reloadToken, fallbackMessage, run])

  // 화면을 떠난 뒤 도착한 응답도 무시한다(순번을 올려 두면 위 비교에서 걸러진다).
  useEffect(() => {
    return () => {
      latestRequestIdRef.current += 1
    }
  }, [])

  const reload = useCallback(() => {
    setReloadToken((previousToken) => previousToken + 1)
  }, [])

  const loading =
    settled === null || settled.fetcher !== fetcher || settled.reloadToken !== reloadToken

  return {
    data: settled ? settled.data : null,
    loading,
    error: loading || settled === null ? null : settled.error,
    reload,
  }
}
