import { useEffect, useRef, useState } from 'react'
import { fillPlaceBoundaries, sendTestPush } from '@/api/adminApi'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import { useFeedback } from '@/hooks/useFeedback'

// 한 번 호출에 조회할 장소 수. 서버가 장소마다 VWorld를 부르므로 응답이 너무 늦지 않게 나눈다.
const FILL_BATCH_SIZE = 100

type FillPhase = 'idle' | 'running' | 'stopping' | 'done' | 'stopped' | 'stalled' | 'error'

type FillProgress = {
  phase: FillPhase
  /** 이번 실행에서 경계를 저장한 누적 수 */
  updated: number
  /** 이번 실행에서 필지를 못 찾은 누적 수 */
  notFound: number
  /** 마지막 호출의 통신 오류 수(서버가 남겨 두고 다음 호출 때 다시 시도한다) */
  failed: number
  /** 마지막 응답 기준 남은 장소 수. 첫 응답 전엔 null */
  remaining: number | null
  message: string | null
}

const INITIAL_FILL: FillProgress = {
  phase: 'idle',
  updated: 0,
  notFound: 0,
  failed: 0,
  remaining: null,
  message: null,
}

/**
 * 대시보드 하단 유지보수 카드: 장소 경계 채우기 + 푸시 테스트 발송.
 * 둘 다 운영 DB·실기기에 바로 영향이 있어 자주 쓰는 기능은 아니므로 대시보드 맨 아래에 작게 둔다.
 */
export default function AdminMaintenanceSection() {
  return (
    <section className="dashboard-maintenance" aria-labelledby="dashboard-maintenance-title">
      <h2 id="dashboard-maintenance-title" className="dashboard-section-title">유지보수</h2>
      <div className="maintenance-cards">
        <BoundaryFillCard />
        <PushTestCard />
      </div>
    </section>
  )
}

/**
 * 경계가 아직 없는 장소를 VWorld에서 채운다. 서버는 한 번에 limit개만 처리하므로 remaining이 0이 될 때까지 반복한다.
 * 중단은 진행 중인 호출을 끊지 않고(서버에선 이미 처리 중이다) 그 호출이 끝난 뒤 다음 호출을 하지 않는 방식이다.
 */
function BoundaryFillCard() {
  const { run } = useAdminRequest()
  const { toast } = useFeedback()
  const [progress, setProgress] = useState<FillProgress>(INITIAL_FILL)
  const stopRequestedRef = useRef(false)
  // 화면을 떠나면 다음 호출을 하지 않고, 늦게 온 응답으로 상태·토스트도 건드리지 않는다.
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopRequestedRef.current = true
    }
  }, [])

  const isRunning = progress.phase === 'running' || progress.phase === 'stopping'

  const startFill = async () => {
    if (isRunning) return
    stopRequestedRef.current = false
    let updatedTotal = 0
    let notFoundTotal = 0
    setProgress({ ...INITIAL_FILL, phase: 'running' })

    for (;;) {
      const result = await run(fillPlaceBoundaries(FILL_BATCH_SIZE), '경계 채우기에 실패했습니다')
      if (!mountedRef.current) return
      if (!result.ok) {
        // 401이면 이미 로그인 화면으로 보냈으므로 message가 null이다.
        setProgress((previous) => ({ ...previous, phase: 'error', message: result.message }))
        return
      }

      const batch = result.data
      updatedTotal += batch.updated
      notFoundTotal += batch.notFound
      const counted = {
        updated: updatedTotal,
        notFound: notFoundTotal,
        failed: batch.failed,
        remaining: batch.remaining,
      }

      if (batch.remaining <= 0) {
        setProgress({ ...counted, phase: 'done', message: null })
        toast(`경계 채우기 완료: 저장 ${updatedTotal}건, 필지 없음 ${notFoundTotal}건`)
        return
      }
      // 통신 오류 건은 서버가 남겨 두고 다음 호출에서 다시 고르므로, 한 건도 진척이 없으면 계속 돌려도 같은 결과다.
      // 그대로 반복하면 끝나지 않으니 여기서 멈춘다.
      if (batch.updated + batch.notFound === 0) {
        setProgress({
          ...counted,
          phase: 'stalled',
          message:
            batch.failed > 0
              ? `VWorld 통신 오류로 ${batch.failed}건을 처리하지 못해 멈췄습니다. 잠시 뒤 다시 시도하세요.`
              : '서버가 남은 장소를 처리하지 않아 멈췄습니다. 잠시 뒤 다시 시도하세요.',
        })
        return
      }
      if (stopRequestedRef.current) {
        setProgress({ ...counted, phase: 'stopped', message: null })
        return
      }
      setProgress({ ...counted, phase: 'running', message: null })
    }
  }

  const requestStop = () => {
    stopRequestedRef.current = true
    setProgress((previous) => (previous.phase === 'running' ? { ...previous, phase: 'stopping' } : previous))
  }

  const processedTotal = progress.updated + progress.notFound
  const grandTotal = progress.remaining === null ? null : processedTotal + progress.remaining
  const percent = grandTotal ? Math.round((processedTotal / grandTotal) * 100) : 0

  return (
    <div className="maintenance-card">
      <div className="maintenance-card-head">
        <h3>장소 경계 채우기</h3>
        <p>경계(부지 폴리곤)가 아직 없는 장소를 VWorld에서 {FILL_BATCH_SIZE}곳씩 조회해 채웁니다. 새 장소가 생겼을 때 실행하세요.</p>
      </div>

      {progress.phase !== 'idle' && (
        <div className="maintenance-progress" aria-live="polite">
          {grandTotal !== null && grandTotal > 0 && (
            <div
              className="maintenance-progress-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <span style={{ width: `${percent}%` }} />
            </div>
          )}
          <p className="maintenance-progress-text">
            {progress.remaining === null
              ? '조회하는 중…'
              : `저장 ${progress.updated}건 · 필지 없음 ${progress.notFound}건 · 남음 ${progress.remaining}건`}
            {progress.failed > 0 && ` · 통신 오류 ${progress.failed}건(다음에 다시 시도)`}
          </p>
          {progress.phase === 'stopping' && (
            <p className="maintenance-hint">지금 조회 중인 묶음이 끝나면 멈춥니다.</p>
          )}
          {progress.phase === 'stopped' && <p className="maintenance-hint">중단했습니다. 다시 누르면 남은 장소부터 이어서 채웁니다.</p>}
          {progress.phase === 'done' && <p className="maintenance-hint">남은 장소가 없습니다.</p>}
          {progress.message && (
            <p className="maintenance-error" role="alert">{progress.message}</p>
          )}
        </div>
      )}

      <div className="maintenance-actions">
        {isRunning ? (
          <button
            type="button"
            className="maintenance-button"
            onClick={requestStop}
            disabled={progress.phase === 'stopping'}
          >
            {progress.phase === 'stopping' ? '멈추는 중…' : '중단'}
          </button>
        ) : (
          <button type="button" className="maintenance-button primary" onClick={startFill}>
            {progress.phase === 'idle' ? '경계 채우기' : '다시 실행'}
          </button>
        )}
      </div>
    </div>
  )
}

/** 최신 재난문자 1건을 입력한 FCM 토큰 하나에만 보낸다. 실기기 수신 확인용. */
function PushTestCard() {
  const { run } = useAdminRequest()
  const { toast, confirm } = useFeedback()
  const [token, setToken] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const trimmedToken = token.trim()
  const canSend = trimmedToken.length > 0 && !sending

  const handleSend = async () => {
    if (!canSend) return
    const confirmed = await confirm({
      title: '푸시 테스트 발송',
      description:
        '가장 최근 재난문자 1건을 이 토큰의 기기로 실제 발송합니다. 토큰이 유효하지 않으면 서버에서 그 토큰을 삭제합니다.',
      confirmLabel: '보내기',
    })
    if (!confirmed || !mountedRef.current) return
    setSending(true)
    setError(null)
    const result = await run(sendTestPush(trimmedToken), '발송에 실패했습니다')
    if (!mountedRef.current) return
    setSending(false)
    if (result.ok) toast('테스트 푸시를 보냈습니다. 기기에서 수신을 확인하세요.')
    else if (result.message) setError(result.message)
  }

  return (
    <div className="maintenance-card">
      <div className="maintenance-card-head">
        <h3>푸시 테스트 발송</h3>
        <p>앱이 등록한 FCM 토큰을 넣으면 가장 최근 재난문자를 그 기기에만 보냅니다(기기 언어로 번역된 문구).</p>
      </div>

      <label className="maintenance-field">
        <span>푸시 토큰</span>
        <textarea
          value={token}
          onChange={(changeEvent) => {
            setToken(changeEvent.target.value)
            setError(null)
          }}
          placeholder="FCM 토큰 붙여넣기"
          rows={3}
          spellCheck={false}
        />
      </label>
      {error && <p className="maintenance-error" role="alert">{error}</p>}

      <div className="maintenance-actions">
        <button type="button" className="maintenance-button primary" onClick={handleSend} disabled={!canSend}>
          {sending ? '보내는 중…' : '보내기'}
        </button>
      </div>
    </div>
  )
}
