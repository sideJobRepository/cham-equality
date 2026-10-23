import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  FeedbackContext,
  type ConfirmOptions,
  type FeedbackApi,
  type ToastTone,
} from '@/components/common/feedbackContext'
import './Feedback.css'

// 성공·안내 토스트는 잠깐 보였다 사라진다. 오류는 놓치면 안 되니 직접 닫을 때까지 남긴다.
const TOAST_DURATION_MS = 2500

type ToastItem = {
  id: number
  message: string
  tone: ToastTone
}

type PendingConfirm = {
  options: ConfirmOptions
  resolve: (confirmed: boolean) => void
}

type Props = {
  children: ReactNode
}

/**
 * 관리자 화면 공통 토스트·확인창. 브라우저 alert/confirm과 페이지별 flash 상태를 대신한다.
 * 상세 모달 위에서도 떠야 하므로 레이어 z-index는 모달 backdrop(최대 1000)보다 크게 잡는다(Feedback.css).
 */
export default function FeedbackProvider({ children }: Props) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const nextToastIdRef = useRef(1)
  const toastTimersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  // 확인창 Promise를 화면 이탈(언마운트) 때도 정리하려고 ref에 같이 들고 있는다.
  const pendingConfirmRef = useRef<PendingConfirm | null>(null)
  const focusBeforeConfirmRef = useRef<HTMLElement | null>(null)

  const dismissToast = useCallback((toastId: number) => {
    const timer = toastTimersRef.current.get(toastId)
    if (timer) {
      clearTimeout(timer)
      toastTimersRef.current.delete(toastId)
    }
    setToasts((previous) => previous.filter((toastItem) => toastItem.id !== toastId))
  }, [])

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const toastId = nextToastIdRef.current
      nextToastIdRef.current += 1
      setToasts((previous) => [...previous, { id: toastId, message, tone }])
      if (tone !== 'error') {
        toastTimersRef.current.set(
          toastId,
          setTimeout(() => dismissToast(toastId), TOAST_DURATION_MS),
        )
      }
    },
    [dismissToast],
  )

  const settleConfirm = useCallback((confirmed: boolean) => {
    const pending = pendingConfirmRef.current
    if (!pending) return
    pendingConfirmRef.current = null
    setPendingConfirm(null)
    pending.resolve(confirmed)
    // 확인창을 연 버튼으로 포커스를 돌려준다(키보드 사용자가 위치를 잃지 않게).
    focusBeforeConfirmRef.current?.focus?.()
    focusBeforeConfirmRef.current = null
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    // 이미 열린 확인창이 있으면 취소로 끝내고 새 것으로 바꾼다(Promise가 영원히 걸려 있지 않게).
    const previous = pendingConfirmRef.current
    if (previous) previous.resolve(false)
    else focusBeforeConfirmRef.current = document.activeElement as HTMLElement | null

    return new Promise<boolean>((resolve) => {
      const pending = { options, resolve }
      pendingConfirmRef.current = pending
      setPendingConfirm(pending)
    })
  }, [])

  // 확인창이 떠 있는 동안 Escape는 확인창만 닫는다. 아래 상세 모달도 document에서 Escape를 듣고 있어서,
  // window 캡처 단계에서 먼저 받아 전파를 끊어야 모달까지 같이 닫히지 않는다.
  useEffect(() => {
    if (!pendingConfirm) return
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key !== 'Escape') return
      keyboardEvent.stopPropagation()
      keyboardEvent.preventDefault()
      settleConfirm(false)
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [pendingConfirm, settleConfirm])

  // 로그아웃 등으로 Provider가 사라질 때 남은 타이머를 지우고 걸린 확인창은 취소로 끝낸다.
  useEffect(() => {
    const timers = toastTimersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
      pendingConfirmRef.current?.resolve(false)
      pendingConfirmRef.current = null
    }
  }, [])

  const feedbackApi = useMemo<FeedbackApi>(() => ({ toast, confirm }), [toast, confirm])
  const confirmOptions = pendingConfirm?.options

  return (
    <FeedbackContext.Provider value={feedbackApi}>
      {children}

      <div className="feedback-toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((toastItem) => (
          <div
            key={toastItem.id}
            className={`feedback-toast feedback-toast-${toastItem.tone}`}
            role={toastItem.tone === 'error' ? 'alert' : 'status'}
          >
            <span className="feedback-toast-message">{toastItem.message}</span>
            <button
              type="button"
              className="feedback-toast-close"
              aria-label="알림 닫기"
              onClick={() => dismissToast(toastItem.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {confirmOptions && (
        <div className="feedback-confirm-backdrop" onClick={() => settleConfirm(false)}>
          <div
            className="feedback-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="feedback-confirm-title"
            aria-describedby={confirmOptions.description ? 'feedback-confirm-description' : undefined}
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <h2 id="feedback-confirm-title" className="feedback-confirm-title">
              {confirmOptions.title}
            </h2>
            {confirmOptions.description && (
              <p id="feedback-confirm-description" className="feedback-confirm-description">
                {confirmOptions.description}
              </p>
            )}
            <div className="feedback-confirm-actions">
              <button
                type="button"
                className="feedback-confirm-cancel"
                autoFocus={confirmOptions.destructive}
                onClick={() => settleConfirm(false)}
              >
                {confirmOptions.cancelLabel ?? '취소'}
              </button>
              <button
                type="button"
                className={
                  'feedback-confirm-ok' + (confirmOptions.destructive ? ' destructive' : '')
                }
                autoFocus={!confirmOptions.destructive}
                onClick={() => settleConfirm(true)}
              >
                {confirmOptions.confirmLabel ?? '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  )
}
