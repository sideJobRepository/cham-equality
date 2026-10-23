import { createContext } from 'react'
import type { PendingCountKey } from '@/lib/pendingCounts'

/** 건수별 값. null이면 아직 모르거나(첫 로딩) 불러오지 못한 것이다. */
export type PendingCounts = Record<PendingCountKey, number | null>

export type PendingCountsApi = {
  counts: PendingCounts
  /** 불러오는 중. 다시 불러오는 동안에도 직전 숫자는 counts에 그대로 남아 있다. */
  loading: boolean
  /** 마지막 요청에서 하나라도 실패했다. */
  failed: boolean
  /** 승인·반려·피드백 저장처럼 대기 건수가 바뀌는 동작 뒤에 호출한다. */
  refreshCounts: () => void
}

// Provider(PendingCountsProvider.tsx)와 훅(usePendingCounts.ts)이 공유한다.
// 컴포넌트 파일에서 컨텍스트를 같이 export하면 react-refresh 규칙에 걸리므로 따로 둔다.
export const PendingCountsContext = createContext<PendingCountsApi | null>(null)
