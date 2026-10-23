import { useEffect, useState } from 'react'
import {
  downloadFilesAsZip,
  fetchFeedbackDetail,
  getDownloadUrl,
  updateFeedback,
  type AppFeedbackDetail,
  type AppFeedbackImageView,
  type AppFeedbackStatus,
} from '@/api/adminApi'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import { useFeedback } from '@/hooks/useFeedback'
import { saveBlob, triggerDownload } from '@/lib/file'
import './AdminReportDetailModal.css'
import '@/pages/AdminFeedbacksPage.css'

type Props = {
  feedbackId: number
  onClose: () => void
  onSaved: () => void
}

const STATUS_OPTIONS: AppFeedbackStatus[] = ['RECEIVED', 'IN_PROGRESS', 'RESOLVED']

// 목록 페이지와 같은 라벨. 페이지에서 import하면 페이지↔모달 순환 참조가 되므로 각자 들고 있는다
// (기존 AdminAppReportDetailModal도 자기 CATEGORY_LABEL을 따로 가진다).
const STATUS_LABEL: Record<AppFeedbackStatus, string> = {
  RECEIVED: '접수',
  IN_PROGRESS: '확인중',
  RESOLVED: '완료',
}

const CATEGORY_LABEL: Record<string, string> = {
  BUG: '오류/버그',
  IMPROVEMENT: '개선 제안',
  SHELTER_DATA: '대피소 정보 오류',
  CONTENT: '콘텐츠/번역 오류',
  ETC: '기타',
}

export default function AdminFeedbackDetailModal({
  feedbackId,
  onClose,
  onSaved,
}: Props) {
  const { run } = useAdminRequest()
  const { toast } = useFeedback()
  const [detail, setDetail] = useState<AppFeedbackDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<AppFeedbackStatus>('RECEIVED')
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [zipping, setZipping] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    run(fetchFeedbackDetail(feedbackId), '상세 조회 실패').then((result) => {
      if (cancelled) return
      if (result.ok) {
        setDetail(result.data)
        setStatus(result.data.status)
        setAdminNote(result.data.adminNote ?? '')
      } else if (result.message) {
        setError(result.message)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [feedbackId, run])

  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleSave = async () => {
    setSaving(true)
    const result = await run(
      updateFeedback(feedbackId, { status, adminNote: adminNote.trim() || null }),
      '저장 실패',
    )
    setSaving(false)
    if (result.ok) onSaved()
    else if (result.message) toast(result.message, 'error')
  }

  const handleDownload = async (image: AppFeedbackImageView) => {
    setDownloadingId(image.fileId)
    const result = await run(getDownloadUrl(image.fileId), '다운로드 실패')
    setDownloadingId(null)
    if (result.ok) triggerDownload(result.data, image.fileName)
    else if (result.message) toast(result.message, 'error')
  }

  const handleDownloadAll = async () => {
    if (!detail || detail.images.length === 0) return
    const zipName = `feedback-${detail.id}.zip`
    setZipping(true)
    const result = await run(
      downloadFilesAsZip(detail.images.map((image) => image.fileId), zipName),
      '일괄 다운로드 실패',
    )
    setZipping(false)
    if (result.ok) saveBlob(result.data, zipName)
    else if (result.message) toast(result.message, 'error')
  }

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <div className="detail-modal" onClick={(clickEvent) => clickEvent.stopPropagation()}>
        <header className="detail-header">
          <div>
            <h2>앱 피드백 #{feedbackId}</h2>
            {detail && (
              <p className="detail-sub">
                {detail.memberId !== null
                  ? `회원 #${detail.memberId} · ${detail.memberName ?? '이름 없음'}`
                  : '익명 제출'}
                <br />
                {[detail.platform, detail.osVersion, detail.deviceModel, detail.appVersion]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
          <button type="button" className="detail-close" onClick={onClose}>✕</button>
        </header>

        <div className="detail-body">
          {loading && <div className="state">불러오는 중…</div>}
          {error && <div className="state error">{error}</div>}

          {detail && !loading && !error && (
            <>
              <section className="fields">
                <Row label="상태">
                  <span className={`badge badge-${detail.status.toLowerCase()}`}>
                    {STATUS_LABEL[detail.status]}
                  </span>
                </Row>
                <Row label="분류">
                  {detail.category ? CATEGORY_LABEL[detail.category] ?? detail.category : '-'}
                </Row>
                <Row label="접수">{detail.createDate?.slice(0, 16).replace('T', ' ')}</Row>
                <Row label="최근 수정">{detail.modifyDate?.slice(0, 16).replace('T', ' ') ?? '-'}</Row>
                <Row label="작성 화면">{detail.screen ?? '-'}</Row>
                <Row label="연락처">{detail.contact ?? '-'}</Row>
                <Row label="내용">{detail.content ?? '-'}</Row>
              </section>

              <section className="images-section">
                <div className="images-header">
                  <h3>첨부 스크린샷 ({detail.images.length}장)</h3>
                  {detail.images.length > 0 && (
                    <button
                      type="button"
                      className="zip-btn"
                      onClick={handleDownloadAll}
                      disabled={zipping}
                    >
                      {zipping ? '다운로드 중…' : '전체 다운로드'}
                    </button>
                  )}
                </div>
                {detail.images.length === 0 ? (
                  <p className="no-images">첨부된 스크린샷이 없습니다.</p>
                ) : (
                  <div className="images-grid">
                    {detail.images.map((image) => (
                      <figure key={image.fileId} className="image-card">
                        <a href={image.url} target="_blank" rel="noopener noreferrer">
                          <img src={image.url} alt={image.fileName} />
                        </a>
                        <figcaption>
                          <span className="desc">{image.fileName}</span>
                          <button
                            type="button"
                            className="download-btn"
                            disabled={downloadingId === image.fileId}
                            onClick={() => handleDownload(image)}
                          >
                            {downloadingId === image.fileId ? '받는 중…' : '다운로드'}
                          </button>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </section>

              <section className="feedback-admin-form">
                <h3>처리</h3>
                <label>
                  상태
                  <select
                    value={status}
                    onChange={(changeEvent) => setStatus(changeEvent.target.value as AppFeedbackStatus)}
                  >
                    {STATUS_OPTIONS.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>{STATUS_LABEL[statusOption]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  관리자 메모 (내부용, 테스터에게 보이지 않음)
                  <textarea
                    value={adminNote}
                    onChange={(changeEvent) => setAdminNote(changeEvent.target.value)}
                    placeholder="처리 내용이나 담당자를 남겨두세요."
                  />
                </label>
              </section>
            </>
          )}
        </div>

        {detail && !loading && !error && (
          <footer className="detail-footer">
            <button type="button" className="approve-btn" disabled={saving} onClick={handleSave}>
              {saving ? '저장 중…' : '저장'}
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <span className="row-value">{children}</span>
    </div>
  )
}
