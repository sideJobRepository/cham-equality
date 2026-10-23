import { useContext } from 'react'
import { FeedbackContext, type FeedbackApi } from '@/components/common/feedbackContext'

/** 토스트·확인창. 관리자 화면은 전부 RequireAdmin 안의 FeedbackProvider 아래에서 렌더된다. */
export function useFeedback(): FeedbackApi {
  const feedback = useContext(FeedbackContext)
  if (!feedback) {
    throw new Error('useFeedback은 FeedbackProvider 안에서만 쓸 수 있습니다')
  }
  return feedback
}
