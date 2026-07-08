import { lazy, Suspense, useEffect, useState } from 'react'

// CKEditor 번들이 무거워서(≈1MB+) 매뉴얼 편집 모달을 열 때만 로드한다.
const RichTextEditor = lazy(() => import('@/components/RichTextEditor'))
import ManualMobilePreview from '@/components/ManualMobilePreview'
import { createManual, fetchManualDetail, updateManual } from '@/api/manualApi'
import { UnauthorizedError } from '@/api/adminApi'
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
  onUnauthorized: () => void
}

export default function AdminManualEditModal({ manualId, onClose, onSaved, onUnauthorized }: Props) {
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
    fetchManualDetail(manualId)
      .then((m) => {
        if (cancelled) return
        setLanguage(m.language)
        setTitle(m.title)
        setContentHtml(m.contentHtml)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        if (e instanceof UnauthorizedError) {
          onUnauthorized()
          return
        }
        setLoadError(e instanceof Error ? e.message : '매뉴얼을 불러오지 못했습니다')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [manualId, onUnauthorized])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('제목을 입력해주세요')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const body = { language, title: title.trim(), contentHtml }
      if (isEdit && manualId !== null) {
        await updateManual(manualId, body)
      } else {
        await createManual(body)
      }
      onSaved()
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) onUnauthorized()
      else setError(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setSubmitting(false)
    }
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
                  onChange={(e) => setLanguage(e.target.value as ManualLanguage)}
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
                  onChange={(e) => setTitle(e.target.value)}
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
