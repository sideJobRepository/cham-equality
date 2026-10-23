import { createContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  // 삭제·반려처럼 되돌리기 어려운 동작. 확인 버튼을 경고색으로 그리고 기본 포커스를 취소에 둔다.
  destructive?: boolean
}

export type FeedbackApi = {
  toast: (message: string, tone?: ToastTone) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

// Provider(Feedback.tsx)와 훅(useFeedback.ts)이 공유한다. 컴포넌트 파일에서 컨텍스트를 같이 export하면
// react-refresh 규칙에 걸리므로 따로 둔다.
export const FeedbackContext = createContext<FeedbackApi | null>(null)
