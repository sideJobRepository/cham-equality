import { useEffect, useState } from 'react'
import {
  createContent,
  updateContent,
  uploadContentImage,
} from '@/api/contentApi'
import { UnauthorizedError } from '@/api/adminApi'
import {
  CONTENT_TYPE_LABEL,
  type Content,
  type ContentType,
  type ContentUpsertRequest,
} from '@/types/content'
import './AdminContentEditModal.css'

type Props = {
  content: Content | null // null = 신규 작성
  defaultType?: ContentType
  onClose: () => void
  onSaved: () => void
  onUnauthorized: () => void
}

const TYPE_OPTIONS: { value: ContentType; label: string }[] = (
  Object.entries(CONTENT_TYPE_LABEL) as [ContentType, string][]
).map(([value, label]) => ({ value, label }))

type ImageUploadStatus = 'uploading' | 'done' | 'failed'

type ImageState =
  // 기존 이미지(편집 모드 진입 시 서버가 내려준 것). fileId/URL 모두 서버에서 받은 값.
  | { kind: 'existing'; fileId: number | null; url: string }
  // 새로 선택된 파일을 업로드 중/완료/실패한 상태
  | { kind: 'new'; file: File; previewUrl: string; status: ImageUploadStatus; fileId: number | null; errorMessage: string | null }
  | null

export default function AdminContentEditModal({ content, defaultType, onClose, onSaved, onUnauthorized }: Props) {
  const isEdit = content !== null
  const [name, setName] = useState(content?.name ?? '')
  const [type, setType] = useState<ContentType>(content?.type ?? defaultType ?? 'IN_APP_POPUP')
  const [image, setImage] = useState<ImageState>(() => {
    if (content?.imageUrl) {
      return { kind: 'existing', fileId: content.imageFileId, url: content.imageUrl }
    }
    return null
  })
  const [url, setUrl] = useState(content?.url ?? '')
  const [startDate, setStartDate] = useState(content?.startDate ?? '')
  const [endDate, setEndDate] = useState(content?.endDate ?? '')
  const [submitting, setSubmitting] = useState(false)
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

  // 모달 닫힐 때 blob URL 해제
  useEffect(() => {
    return () => {
      if (image?.kind === 'new') URL.revokeObjectURL(image.previewUrl)
    }
  }, [image])

  const startUpload = (file: File, previewUrl: string) => {
    uploadContentImage(file)
      .then((res) => {
        setImage((prev) =>
          prev?.kind === 'new' && prev.previewUrl === previewUrl
            ? { ...prev, status: 'done', fileId: res.fileId, errorMessage: null }
            : prev,
        )
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : '업로드 실패'
        setImage((prev) =>
          prev?.kind === 'new' && prev.previewUrl === previewUrl
            ? { ...prev, status: 'failed', errorMessage: msg }
            : prev,
        )
      })
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    // 이전 새 파일이 있었으면 blob URL 해제
    if (image?.kind === 'new') URL.revokeObjectURL(image.previewUrl)
    const previewUrl = URL.createObjectURL(file)
    setImage({
      kind: 'new',
      file,
      previewUrl,
      status: 'uploading',
      fileId: null,
      errorMessage: null,
    })
    startUpload(file, previewUrl)
  }

  const handleRetry = () => {
    if (image?.kind !== 'new' || image.status !== 'failed') return
    setImage({ ...image, status: 'uploading', errorMessage: null })
    startUpload(image.file, image.previewUrl)
  }

  const handleRemoveImage = () => {
    if (image?.kind === 'new') URL.revokeObjectURL(image.previewUrl)
    setImage(null)
  }

  const isUploading = image?.kind === 'new' && image.status === 'uploading'
  const isFailed = image?.kind === 'new' && image.status === 'failed'

  const showPopupDates = type === 'IN_APP_POPUP'
  const dateRangeError =
    showPopupDates && startDate && endDate && startDate > endDate
      ? '종료일은 시작일 이후여야 합니다'
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('이름을 입력해주세요')
      return
    }
    if (dateRangeError) {
      setError(dateRangeError)
      return
    }
    if (isUploading) {
      setError('이미지 업로드가 끝난 뒤 저장해주세요')
      return
    }
    if (isFailed) {
      setError('이미지 업로드 실패 — 재시도하거나 이미지를 제거해주세요')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const imageFileId = image === null
        ? null
        : image.kind === 'existing'
          ? image.fileId
          : image.fileId // kind === 'new' && status === 'done'
      const body: ContentUpsertRequest = {
        name: name.trim(),
        type,
        imageFileId,
        url: url.trim() || null,
        startDate: showPopupDates ? (startDate || null) : null,
        endDate: showPopupDates ? (endDate || null) : null,
      }
      if (isEdit && content) {
        await updateContent(content.id, body)
      } else {
        await createContent(body)
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
    <div className="content-edit-backdrop" onClick={onClose}>
      <div className="content-edit-modal" onClick={(e) => e.stopPropagation()}>
        <header className="content-edit-header">
          <h2>{isEdit ? `컨텐츠 #${content?.id} 편집` : '컨텐츠 신규 등록'}</h2>
          <button type="button" className="content-edit-close" onClick={onClose}>✕</button>
        </header>

        <form className="content-edit-body" onSubmit={handleSubmit}>
          <div className="field">
            <label>이름 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="field">
            <label>타입 *</label>
            <div className="type-tabs" role="radiogroup" aria-label="컨텐츠 타입">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={type === opt.value}
                  className={'type-tab' + (type === opt.value ? ' active' : '')}
                  onClick={() => setType(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>이미지</label>
            {image === null ? (
              <label className="content-image-picker">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFilePick}
                  disabled={submitting}
                />
                <span className="content-image-picker-label">📷 이미지 선택</span>
                <span className="content-image-picker-hint">클릭해서 파일을 업로드하세요</span>
              </label>
            ) : (
              <div className={`content-image-card status-${image.kind === 'new' ? image.status : 'existing'}`}>
                <div className="content-image-thumb">
                  <img
                    src={image.kind === 'new' ? image.previewUrl : image.url}
                    alt=""
                    onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                  />
                  {isUploading && <div className="content-image-overlay">업로드 중…</div>}
                  {isFailed && <div className="content-image-overlay error">실패</div>}
                </div>
                <div className="content-image-actions">
                  {image.kind === 'new' && image.status === 'done' && (
                    <span className="content-image-status done">업로드 완료</span>
                  )}
                  {image.kind === 'existing' && (
                    <span className="content-image-status">기존 이미지</span>
                  )}
                  {isFailed && (
                    <>
                      <span className="content-image-status error" title={image.errorMessage ?? ''}>
                        {image.errorMessage ?? '업로드 실패'}
                      </span>
                      <button type="button" className="content-image-retry" onClick={handleRetry}>
                        재시도
                      </button>
                    </>
                  )}
                  <label className="content-image-replace">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFilePick}
                      disabled={submitting || isUploading}
                    />
                    교체
                  </label>
                  <button
                    type="button"
                    className="content-image-remove"
                    onClick={handleRemoveImage}
                    disabled={submitting || isUploading}
                  >
                    제거
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="field">
            <label>URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {showPopupDates && (
            <div className="field">
              <label>노출 기간</label>
              <div className="date-range">
                <span className="date-input" data-empty={!startDate || undefined}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-label="시작일"
                  />
                  <span className="date-input-display">{startDate || 'YYYY-MM-DD'}</span>
                </span>
                <span className="date-range-sep">~</span>
                <span className="date-input" data-empty={!endDate || undefined}>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    aria-label="종료일"
                  />
                  <span className="date-input-display">{endDate || 'YYYY-MM-DD'}</span>
                </span>
              </div>
              {dateRangeError && <div className="content-edit-hint error">{dateRangeError}</div>}
              {!dateRangeError && <div className="content-edit-hint">비워두면 기간 제한 없이 노출됩니다</div>}
            </div>
          )}

          {error && <div className="content-edit-error">{error}</div>}

          <footer className="content-edit-footer">
            <button type="button" onClick={onClose} disabled={submitting}>취소</button>
            <button
              type="submit"
              className="primary"
              disabled={submitting || !!dateRangeError || isUploading || isFailed}
            >
              {submitting ? '저장 중…' : isUploading ? '업로드 대기…' : '저장'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
