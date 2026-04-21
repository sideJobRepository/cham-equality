import { useEffect, useState } from 'react'
import {
  createShelterReport,
  fetchShelterReportDetail,
  updateShelterReport,
  uploadShelterImage,
  type ImageChange,
  type ShelterImageCategory,
  type ShelterReportImageView,
} from '../api/shelterApi'
import type { Shelter } from '../types/shelter'
import './ShelterReportModal.css'

type Props = {
  shelter: Shelter
  reportId?: number
  onClose: () => void
  onSubmitted: (flash: string) => void
}

type TriBool = 'true' | 'false' | ''

type UploadStatus = 'uploading' | 'done' | 'failed'

type PendingImage = {
  key: string
  file: File
  previewUrl: string
  status: UploadStatus
  fileId: number | null
  errorMessage: string | null
  category: ShelterImageCategory | ''
  description: string
}

type ExistingImage = ShelterReportImageView & {
  removed: boolean
}

const CATEGORY_OPTIONS: { value: ShelterImageCategory; label: string }[] = [
  { value: 'EXTERIOR', label: '외관' },
  { value: 'INTERIOR', label: '내부' },
  { value: 'ENTRANCE', label: '출입구' },
  { value: 'RAMP', label: '경사로' },
  { value: 'ELEVATOR', label: '엘리베이터' },
  { value: 'TOILET', label: '장애인화장실' },
  { value: 'BRAILLE', label: '점자블록' },
  { value: 'SIGNAGE', label: '안내문' },
  { value: 'ETC', label: '기타' },
]

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
)

function fromBool(v: boolean | null | undefined): TriBool {
  if (v === true) return 'true'
  if (v === false) return 'false'
  return ''
}

function toBool(v: TriBool): boolean | null {
  if (v === 'true') return true
  if (v === 'false') return false
  return null
}

export default function ShelterReportModal({ shelter, reportId, onClose, onSubmitted }: Props) {
  const isEdit = reportId !== undefined
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState(isEdit ? '' : shelter.name ?? '')
  const [builtYear, setBuiltYear] = useState<string>(
    isEdit ? '' : shelter.builtYear?.toString() ?? '',
  )
  const [safetyGrade, setSafetyGrade] = useState<string>(
    isEdit ? '' : shelter.safetyGrade?.toString() ?? '',
  )
  const [signageLanguage, setSignageLanguage] = useState(isEdit ? '' : shelter.signageLanguage ?? '')
  const [accessibleToilet, setAccessibleToilet] = useState<TriBool>(
    isEdit ? '' : fromBool(shelter.accessibleToilet),
  )
  const [ramp, setRamp] = useState<TriBool>(isEdit ? '' : fromBool(shelter.ramp))
  const [elevator, setElevator] = useState<TriBool>(isEdit ? '' : fromBool(shelter.elevator))
  const [brailleBlock, setBrailleBlock] = useState<TriBool>(
    isEdit ? '' : fromBool(shelter.brailleBlock),
  )
  const [etcFacilities, setEtcFacilities] = useState(isEdit ? '' : shelter.etcFacilities ?? '')
  const [requestNote, setRequestNote] = useState('')
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [images, setImages] = useState<PendingImage[]>([])
  const [userPassword, setUserPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit || reportId === undefined) return
    setLoading(true)
    fetchShelterReportDetail(reportId)
      .then((d) => {
        setName(d.name ?? '')
        setBuiltYear(d.builtYear?.toString() ?? '')
        setSafetyGrade(d.safetyGrade?.toString() ?? '')
        setSignageLanguage(d.signageLanguage ?? '')
        setAccessibleToilet(fromBool(d.accessibleToilet))
        setRamp(fromBool(d.ramp))
        setElevator(fromBool(d.elevator))
        setBrailleBlock(fromBool(d.brailleBlock))
        setEtcFacilities(d.etcFacilities ?? '')
        setRequestNote(d.requestNote ?? '')
        setExistingImages(d.images.map((img) => ({ ...img, removed: false })))
      })
      .catch((e: unknown) =>
        setLoadError(e instanceof Error ? e.message : '리포트 조회 실패'),
      )
      .finally(() => setLoading(false))
  }, [isEdit, reportId])

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

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    }
  }, [images])

  const updateImage = (key: string, patch: Partial<PendingImage>) => {
    setImages((prev) => prev.map((img) => (img.key === key ? { ...img, ...patch } : img)))
  }

  const startUpload = (img: PendingImage) => {
    uploadShelterImage(img.file)
      .then((res) => {
        updateImage(img.key, { status: 'done', fileId: res.fileId, errorMessage: null })
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : '업로드 실패'
        updateImage(img.key, { status: 'failed', errorMessage: msg })
      })
  }

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    if (picked.length === 0) return
    const newImages: PendingImage[] = picked.map((file) => ({
      key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading',
      fileId: null,
      errorMessage: null,
      category: '',
      description: '',
    }))
    setImages((prev) => [...prev, ...newImages])
    newImages.forEach(startUpload)
    e.target.value = ''
  }

  const retryUpload = (key: string) => {
    const target = images.find((img) => img.key === key)
    if (!target) return
    updateImage(key, { status: 'uploading', errorMessage: null })
    startUpload(target)
  }

  const removeImage = (key: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.key === key)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((img) => img.key !== key)
    })
  }

  const toggleExistingRemoved = (fileId: number) => {
    setExistingImages((prev) =>
      prev.map((img) => (img.fileId === fileId ? { ...img, removed: !img.removed } : img)),
    )
  }

  const uploadingCount = images.filter((img) => img.status === 'uploading').length
  const failedCount = images.filter((img) => img.status === 'failed').length
  const canSubmit =
    !submitting && !loading && uploadingCount === 0 && (!isEdit || userPassword.trim().length > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    try {
      const doneImages = images.filter(
        (img): img is PendingImage & { fileId: number } =>
          img.status === 'done' && img.fileId !== null,
      )

      if (!isEdit) {
        await createShelterReport({
          shelterId: shelter.id,
          name: name.trim() || null,
          builtYear: builtYear ? Number(builtYear) : null,
          safetyGrade: safetyGrade ? Number(safetyGrade) : null,
          signageLanguage: signageLanguage.trim() || null,
          accessibleToilet: toBool(accessibleToilet),
          ramp: toBool(ramp),
          elevator: toBool(elevator),
          brailleBlock: toBool(brailleBlock),
          etcFacilities: etcFacilities.trim() || null,
          requestNote: requestNote.trim() || null,
          images: doneImages.map((img) => ({
            fileId: img.fileId,
            category: img.category || null,
            description: img.description.trim() || null,
          })),
        })
        onSubmitted('조사 정보가 접수되었습니다 (승인 대기)')
      } else {
        const imageChanges: ImageChange[] = [
          ...existingImages
            .filter((img) => img.removed)
            .map(
              (img): ImageChange => ({
                fileId: img.fileId,
                status: 'DELETE',
                category: null,
                description: null,
              }),
            ),
          ...doneImages.map(
            (img): ImageChange => ({
              fileId: img.fileId,
              status: 'CREATE',
              category: img.category || null,
              description: img.description.trim() || null,
            }),
          ),
        ]
        await updateShelterReport(
          reportId!,
          {
            name: name.trim() || null,
            builtYear: builtYear ? Number(builtYear) : null,
            safetyGrade: safetyGrade ? Number(safetyGrade) : null,
            signageLanguage: signageLanguage.trim() || null,
            accessibleToilet: toBool(accessibleToilet),
            ramp: toBool(ramp),
            elevator: toBool(elevator),
            brailleBlock: toBool(brailleBlock),
            etcFacilities: etcFacilities.trim() || null,
            requestNote: requestNote.trim() || null,
            imageChanges,
          },
          userPassword,
        )
        onSubmitted('수정이 반영되었습니다')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '제출 실패')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-loading">불러오는 중…</div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-loading modal-error-state">{loadError}</div>
          <div className="modal-footer">
            <button type="button" onClick={onClose}>닫기</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{isEdit ? '대피소 조사 정보 수정' : '대피소 조사 정보 제보'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </header>

        <div className="modal-info">
          <div><span>주소</span>{shelter.address ?? '-'}</div>
          <div><span>관리기관</span>{shelter.managingAuthorityName ?? '-'} · {shelter.managingAuthorityTelNo ?? '-'}</div>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="field">
            <label>시설명 (현장 확인)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field-row">
            <div className="field">
              <label>건축 연도</label>
              <input type="number" value={builtYear} onChange={(e) => setBuiltYear(e.target.value)} />
            </div>
            <div className="field">
              <label>안전 등급 (내진설계)</label>
              <input type="number" value={safetyGrade} onChange={(e) => setSafetyGrade(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>안내문 언어</label>
            <input
              value={signageLanguage}
              onChange={(e) => setSignageLanguage(e.target.value)}
              placeholder="예: 한국어,영어,중국어"
            />
          </div>

          <fieldset className="accessibility">
            <legend>이동약자 편의시설</legend>
            <TriBoolRow label="장애인 화장실" value={accessibleToilet} onChange={setAccessibleToilet} />
            <TriBoolRow label="경사로" value={ramp} onChange={setRamp} />
            <TriBoolRow label="엘리베이터" value={elevator} onChange={setElevator} />
            <TriBoolRow label="점자블록" value={brailleBlock} onChange={setBrailleBlock} />
            <div className="field">
              <label>기타 접근성 시설</label>
              <input
                value={etcFacilities}
                onChange={(e) => setEtcFacilities(e.target.value)}
                placeholder="예: 자동문, 수유실, 시각장애인 안내방송"
              />
            </div>
          </fieldset>

          <div className="field">
            <label>조사 메모</label>
            <textarea value={requestNote} onChange={(e) => setRequestNote(e.target.value)} rows={3} />
          </div>

          {isEdit && existingImages.length > 0 && (
            <fieldset className="images">
              <legend>기존 사진 ({existingImages.filter((i) => !i.removed).length} / {existingImages.length}장)</legend>
              <ul className="image-list">
                {existingImages.map((img) => (
                  <li key={img.fileId} className={`image-item ${img.removed ? 'status-removed' : ''}`}>
                    <div className="image-thumb">
                      <img src={img.url} alt={img.fileName} />
                      {img.removed && <div className="image-overlay error">삭제 예정</div>}
                    </div>
                    <div className="image-meta">
                      <div className="image-name">{img.fileName}</div>
                      {img.category && (
                        <span className="existing-cat-tag">
                          {CATEGORY_LABEL[img.category] ?? img.category}
                        </span>
                      )}
                      {img.description && <div className="existing-desc">{img.description}</div>}
                    </div>
                    <button
                      type="button"
                      className="image-remove existing-toggle"
                      onClick={() => toggleExistingRemoved(img.fileId)}
                    >
                      {img.removed ? '복구' : '삭제'}
                    </button>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}

          <fieldset className="images">
            <legend>{isEdit ? '추가할 사진' : '현장 사진'}</legend>
            <div className="image-add">
              <label className="file-picker">
                <input type="file" accept="image/*" multiple onChange={handleFilesSelected} />
                사진 추가
              </label>
              <span className="image-count">
                {images.length}장
                {uploadingCount > 0 && ` · 업로드 중 ${uploadingCount}`}
                {failedCount > 0 && ` · 실패 ${failedCount}`}
              </span>
            </div>

            {images.length > 0 && (
              <ul className="image-list">
                {images.map((img) => (
                  <li key={img.key} className={`image-item status-${img.status}`}>
                    <div className="image-thumb">
                      <img src={img.previewUrl} alt={img.file.name} />
                      {img.status === 'uploading' && <div className="image-overlay">업로드 중…</div>}
                      {img.status === 'failed' && <div className="image-overlay error">실패</div>}
                    </div>
                    <div className="image-meta">
                      <div className="image-name">{img.file.name}</div>
                      <select
                        value={img.category}
                        onChange={(e) =>
                          updateImage(img.key, {
                            category: (e.target.value || '') as ShelterImageCategory | '',
                          })
                        }
                        disabled={img.status !== 'done'}
                      >
                        <option value="">카테고리 선택</option>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="설명(선택)"
                        value={img.description}
                        onChange={(e) => updateImage(img.key, { description: e.target.value })}
                        disabled={img.status !== 'done'}
                      />
                      {img.status === 'failed' && (
                        <button type="button" className="retry-btn" onClick={() => retryUpload(img.key)}>
                          재시도
                        </button>
                      )}
                    </div>
                    <button type="button" className="image-remove" onClick={() => removeImage(img.key)}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          {isEdit && (
            <div className="field edit-password">
              <label>수정 비밀번호</label>
              <input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="수정 비밀번호"
                autoComplete="off"
              />
            </div>
          )}

          {error && <div className="modal-error">{error}</div>}

          <footer className="modal-footer">
            <button type="button" onClick={onClose} disabled={submitting}>취소</button>
            <button type="submit" className="primary" disabled={!canSubmit}>
              {submitting
                ? '저장 중…'
                : uploadingCount > 0
                  ? `업로드 대기 (${uploadingCount})`
                  : isEdit
                    ? '수정 저장'
                    : '제출'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

type TriBoolRowProps = {
  label: string
  value: TriBool
  onChange: (v: TriBool) => void
}

function TriBoolRow({ label, value, onChange }: TriBoolRowProps) {
  return (
    <div className="tri-row">
      <span className="tri-label">{label}</span>
      <div className="tri-buttons">
        {(['true', 'false', ''] as TriBool[]).map((v) => (
          <button
            type="button"
            key={v || 'null'}
            className={value === v ? 'active' : ''}
            onClick={() => onChange(v)}
          >
            {v === 'true' ? '있음' : v === 'false' ? '없음' : '모름'}
          </button>
        ))}
      </div>
    </div>
  )
}
