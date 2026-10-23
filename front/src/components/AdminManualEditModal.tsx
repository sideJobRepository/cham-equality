import { lazy, Suspense, useEffect, useState } from 'react'

// CKEditor 번들이 무거워서(≈1MB+) 매뉴얼 편집 모달을 열 때만 로드한다.
const RichTextEditor = lazy(() => import('@/components/RichTextEditor'))
import ManualMobilePreview from '@/components/ManualMobilePreview'
import { createManual, fetchManualDetail, updateManual } from '@/api/manualApi'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import {
  MANUAL_LANGUAGES,
  MANUAL_LANGUAGE_LABEL,
  type ManualLanguage,
} from '@/types/manual'
import './AdminManualEditModal.css'

type Props = {
  manualId: number | null // null = 신규 작성
  onClose: () => void
  onSaved: () => void
}

export default function AdminManualEditModal({ manualId, onClose, onSaved }: Props) {
  const { run } = useAdminRequest()
  const isEdit = manualId !== null
  const [language, setLanguage] = useState<ManualLanguage>('KO')
  const [title, setTitle] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  // 편집 모드는 본문(content)이 상세 조회에서만 오므로 먼저 불러온다.
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 편집 모달은 실수로 입력이 날아가지 않도록 X/취소 버튼으로만 닫는다.
  // (배경 클릭·Escape로는 닫지 않음)
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // 편집 모드: 본문 포함 상세 로드
  useEffect(() => {
    if (manualId === null) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    run(fetchManualDetail(manualId), '매뉴얼을 불러오지 못했습니다').then((result) => {
      if (cancelled) return
      if (result.ok) {
        setLanguage(result.data.language)
        setTitle(result.data.title)
        setContentHtml(result.data.contentHtml)
      } else if (result.message) {
        setLoadError(result.message)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [manualId, run])

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault()
    if (!title.trim()) {
      setError('제목을 입력해주세요')
      return
    }
    setSubmitting(true)
    setError(null)
    const body = { language, title: title.trim(), contentHtml }
    // 수정은 void, 등록은 새 id를 돌려준다. 여기선 성공 여부만 쓰므로 결과 타입을 unknown으로 맞춘다.
    const result = await run<unknown>(
      isEdit && manualId !== null ? updateManual(manualId, body) : createManual(body),
      '저장 실패',
    )
    setSubmitting(false)
    if (result.ok) onSaved()
    else if (result.message) setError(result.message)
  }

  return (
    <>
    <div className="manual-edit-backdrop">
      <div className="manual-edit-modal">
        <header className="manual-edit-header">
          <h2>{isEdit ? `매뉴얼 #${manualId} 편집` : '매뉴얼 신규 등록'}</h2>
          <button type="button" className="manual-edit-close" onClick={onClose} disabled={submitting}>✕</button>
        </header>

        {loading ? (
          <div className="manual-edit-body">
            <div className="manual-editor-loading">매뉴얼 불러오는 중…</div>
          </div>
        ) : loadError ? (
          <div className="manual-edit-body">
            <div className="manual-edit-error">{loadError}</div>
            <footer className="manual-edit-footer">
              <button type="button" onClick={onClose}>닫기</button>
            </footer>
          </div>
        ) : (
          <form className="manual-edit-body" onSubmit={handleSubmit}>
            <div className="manual-edit-meta">
              <div className="field field-language">
                <label htmlFor="manual-language">언어 *</label>
                <select
                  id="manual-language"
                  value={language}
                  onChange={(changeEvent) => setLanguage(changeEvent.target.value as ManualLanguage)}
                >
                  {MANUAL_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {MANUAL_LANGUAGE_LABEL[lang]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field field-title">
                <label htmlFor="manual-title">제목 *</label>
                <input
                  id="manual-title"
                  value={title}
                  onChange={(changeEvent) => setTitle(changeEvent.target.value)}
                  placeholder="매뉴얼 제목"
                  required
                />
              </div>
            </div>

            <div className="field field-content">
              <label>내용</label>
              <Suspense fallback={<div className="manual-editor-loading">에디터 불러오는 중…</div>}>
                <RichTextEditor value={contentHtml} onChange={setContentHtml} />
              </Suspense>
            </div>

            {error && <div className="manual-edit-error">{error}</div>}

            <footer className="manual-edit-footer">
              <button type="button" className="preview" onClick={() => setShowPreview(true)}>
                📱 미리보기
              </button>
              <button type="button" onClick={onClose} disabled={submitting}>취소</button>
              <button type="submit" className="primary" disabled={submitting}>
                {submitting ? '저장 중…' : '저장'}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>

      {showPreview && (
        <ManualMobilePreview
          language={language}
          title={title}
          html={contentHtml}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}
