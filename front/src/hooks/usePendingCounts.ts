import { useContext } from 'react'
import { PendingCountsContext, type PendingCountsApi } from '@/components/common/pendingCountsContext'

/** 대기 건수(대시보드 카드·사이드바 배지). 관리자 화면은 전부 RequireAdmin 안의 PendingCountsProvider 아래에서 렌더된다. */
export function usePendingCounts(): PendingCountsApi {
  const pendingCounts = useContext(PendingCountsContext)
  if (!pendingCounts) {
    throw new Error('usePendingCounts는 PendingCountsProvider 안에서만 쓸 수 있습니다')
  }
  return pendingCounts
}
