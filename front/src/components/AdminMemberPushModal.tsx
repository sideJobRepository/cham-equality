import { useEffect, useState } from 'react'
import {
  errorMessage,
  sendMemberPush,
  UnauthorizedError,
  type AdminMember,
} from '@/api/adminApi'
import './AdminReportDetailModal.css'
import '@/pages/AdminMembersPage.css'

// 폰 알림에서 잘리지 않을 정도. 서버(MemberPushService)와 같은 값이다.
const TITLE_MAX = 50
const BODY_MAX = 500

type Props = {
  member: AdminMember
  onClose: () => void
  onSent: (sentDeviceCount: number) => void
  onUnauthorized: () => void
}

export default function AdminMemberPushModal({ member, onClose, onSent, onUnauthorized }: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !sending

  const handleSend = () => {
    if (!canSend) return
    if (!window.confirm(`${member.name ?? `#${member.id}`}님에게 알림을 보낼까요? 보낸 알림은 취소할 수 없어요.`)) return
    setSending(true)
    setError(null)
    sendMemberPush(member.id, { title: title.trim(), body: body.trim() })
      .then(onSent)
      .catch((e: unknown) => {
        if (e instanceof UnauthorizedError) {
          onUnauthorized()
          return
        }
        setError(errorMessage(e, '발송에 실패했어요.'))
      })
      .finally(() => setSending(false))
  }

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <header className="detail-header">
          <div>
            <h2>푸시 보내기</h2>
            <p className="detail-sub">
              {member.name ?? `#${member.id}`} · 알림 기기 {member.pushDeviceCount}대
            </p>
          </div>
          <button type="button" className="detail-close" onClick={onClose}>✕</button>
        </header>

        <div className="detail-body">
          <section className="member-push-form">
            <label>
              <span className="label-row">
                제목 <span className="counter">{title.length}/{TITLE_MAX}</span>
              </span>
              <input
                value={title}
                maxLength={TITLE_MAX}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 제보가 반영되었어요"
              />
            </label>
            <label>
              <span className="label-row">
                내용 <span className="counter">{body.length}/{BODY_MAX}</span>
              </span>
              <textarea
                value={body}
                maxLength={BODY_MAX}
                onChange={(e) => setBody(e.target.value)}
                placeholder="알림에 보일 내용을 입력하세요."
              />
            </label>
            <p className="hint">
              앱이 설정한 언어와 관계없이 입력한 그대로 보내요. 알림을 누르면 앱이 열려요.
            </p>
            {error && <div className="state error">{error}</div>}
          </section>
        </div>

        <footer className="detail-footer">
          <button type="button" className="approve-btn" disabled={!canSend} onClick={handleSend}>
            {sending ? '보내는 중…' : '보내기'}
          </button>
        </footer>
      </div>
    </div>
  )
}
