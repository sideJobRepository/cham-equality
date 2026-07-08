import { useEffect } from 'react'
import { MANUAL_LANGUAGE_LABEL, type ManualLanguage } from '@/types/manual'
// CKEditor 본문 전용 스타일 — 에디터 밖에서 출력 HTML을 동일하게 렌더링하기 위함(.ck-content).
import 'ckeditor5/ckeditor5-content.css'
import './ManualMobilePreview.css'

type Props = {
  language: ManualLanguage
  title: string
  html: string
  onClose: () => void
}

/**
 * 매뉴얼이 앱(모바일)에서 어떻게 보일지 보여주는 미리보기.
 * 실제 기기 폭(≈390px)의 프레임 안에 제목 헤더 + CKEditor 본문(.ck-content)을 렌더링한다.
 * 본문 이미지는 base64로 인라인돼 있어 별도 네트워크 없이 그대로 표시된다.
 */
export default function ManualMobilePreview({ language, title, html, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="manual-preview-backdrop" onClick={onClose}>
      <div className="manual-preview-stage" onClick={(e) => e.stopPropagation()}>
        <div className="manual-preview-toolbar">
          <span className="manual-preview-caption">
            모바일 미리보기 · {MANUAL_LANGUAGE_LABEL[language]}
          </span>
          <button type="button" className="manual-preview-close" onClick={onClose}>✕</button>
        </div>

        <div className="manual-phone">
          <div className="manual-phone-notch" />
          <div className="manual-phone-screen">
            <header className="manual-phone-appbar">
              <span className="manual-phone-back">‹</span>
              <span className="manual-phone-title" title={title}>
                {title.trim() || '매뉴얼'}
              </span>
              <span className="manual-phone-back-spacer" />
            </header>
            <div className="manual-phone-content">
              {html.trim() ? (
                <div
                  className="ck-content"
                  dir="ltr"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <div className="manual-phone-empty">(내용 없음)</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
