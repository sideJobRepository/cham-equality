import { useEffect, useState } from 'react'
import {
  createShelterReport,
  uploadShelterImage,
  type ShelterImageCategory,
} from '../api/shelterApi'
import type { Shelter } from '../types/shelter'
import './ShelterReportModal.css'

type Props = {
  shelter: Shelter
  onClose: () => void
  onSubmitted: () => void
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

export default function ShelterReportModal({ shelter, onClose, onSubmitted }: Props) {
  const [name, setName] = useState(shelter.name ?? '')
  const [builtYear, setBuiltYear] = useState<string>(shelter.builtYear?.toString() ?? '')
  const [safetyGrade, setSafetyGrade] = useState<string>(shelter.safetyGrade?.toString() ?? '')
  const [signageLanguage, setSignageLanguage] = useState(shelter.signageLanguage ?? '')
  const [accessibleToilet, setAccessibleToilet] = useState<TriBool>(fromBool(shelter.accessibleToilet))
  const [ramp, setRamp] = useState<TriBool>(fromBool(shelter.ramp))
  const [elevator, setElevator] = useState<TriBool>(fromBool(shelter.elevator))
  const [brailleBlock, setBrailleBlock] = useState<TriBool>(fromBool(shelter.brailleBlock))
  const [etcFacilities, setEtcFacilities] = useState(shelter.etcFacilities ?? '')
  const [requestNote, setRequestNote] = useState('')
  const [images, setImages] = useState<PendingImage[]>([])
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

  const uploadingCount = images.filter((img) => img.status === 'uploading').length
  const failedCount = images.filter((img) => img.status === 'failed').length
  const canSubmit = !submitting && uploadingCount === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    try {
      const doneImages = images.filter(
        (img): img is PendingImage & { fileId: number } => img.status === 'done' && img.fileId !== null,
      )

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
      onSubmitted()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '제출 실패')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>대피소 조사 정보 제보</h2>
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

          <fieldset className="images">
            <legend>현장 사진</legend>
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

          {error && <div className="modal-error">{error}</div>}

          <footer className="modal-footer">
            <button type="button" onClick={onClose} disabled={submitting}>취소</button>
            <button type="submit" className="primary" disabled={!canSubmit}>
              {submitting ? '제출 중…' : uploadingCount > 0 ? `업로드 대기 (${uploadingCount})` : '제출'}
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
