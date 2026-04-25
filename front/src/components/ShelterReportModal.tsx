import { useEffect, useMemo, useState } from 'react'
import {
  createShelterReport,
  fetchShelterReportDetail,
  updateShelterReport,
  uploadShelterImage,
  type ImageChange,
  type ShelterImageCategory,
  type ShelterReportImageView,
} from '../api/shelterApi'
import { SHELTER_TYPE_LABEL, type Shelter } from '../types/shelter'
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
  category: ShelterImageCategory
}

type ExistingImage = ShelterReportImageView & {
  removed: boolean
}

const CATEGORY_LABEL: Record<ShelterImageCategory, string> = {
  EXTERIOR: '외관',
  INTERIOR: '내부',
  ENTRANCE: '출입구',
  RAMP: '경사로',
  ELEVATOR: '엘리베이터',
  TOILET: '장애인화장실',
  BRAILLE: '점자블록',
  SIGNAGE: '안내문',
  ETC: '기타',
}

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
  const isReInvestigation = !isEdit && shelter.surveyStatus === 'RE_INVESTIGATION'
  const requiresPassword = isEdit || isReInvestigation

  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)

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

  const handleFilesPicked = (
    e: React.ChangeEvent<HTMLInputElement>,
    category: ShelterImageCategory,
  ) => {
    const picked = Array.from(e.target.files ?? [])
    if (picked.length === 0) return
    const newImages: PendingImage[] = picked.map((file) => ({
      key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading',
      fileId: null,
      errorMessage: null,
      category,
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

  const newImagesByCategory = useMemo(() => {
    const map: Record<ShelterImageCategory, PendingImage[]> = {
      EXTERIOR: [], INTERIOR: [], ENTRANCE: [], RAMP: [], ELEVATOR: [],
      TOILET: [], BRAILLE: [], SIGNAGE: [], ETC: [],
    }
    images.forEach((img) => map[img.category].push(img))
    return map
  }, [images])

  const existingByCategory = useMemo(() => {
    const map: Record<string, ExistingImage[]> = {}
    existingImages.forEach((img) => {
      const key = img.category ?? 'UNKNOWN'
      if (!map[key]) map[key] = []
      map[key].push(img)
    })
    return map
  }, [existingImages])

  const uploadingCount = images.filter((img) => img.status === 'uploading').length
  const failedCount = images.filter((img) => img.status === 'failed').length
  const canSubmit =
    !submitting && !loading && uploadingCount === 0 && (!requiresPassword || userPassword.trim().length > 0)

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
        await createShelterReport(
          {
            shelterId: shelter.id,
            signageLanguage: signageLanguage.trim() || null,
            accessibleToilet: toBool(accessibleToilet),
            ramp: toBool(ramp),
            elevator: toBool(elevator),
            brailleBlock: toBool(brailleBlock),
            etcFacilities: etcFacilities.trim() || null,
            requestNote: requestNote.trim() || null,
            images: doneImages.map((img) => ({
              fileId: img.fileId,
              category: img.category,
              description: null,
            })),
          },
          isReInvestigation ? userPassword : undefined,
        )
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
              category: img.category,
              description: null,
            }),
          ),
        ]
        await updateShelterReport(
          reportId!,
          {
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
          <h2>{isEdit ? '대피소 조사 정보 수정' : '대피소 조사 정보'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </header>

        <div className="modal-info">
          <div><span>시설명</span>{shelter.name}</div>
          <div><span>대피소 타입</span>{shelter.shelterType ? SHELTER_TYPE_LABEL[shelter.shelterType] : '-'}</div>
          <div><span>주소</span>{shelter.address ?? '-'}{shelter.oldAddress ? ` (${shelter.oldAddress})` : ''}</div>
          <div><span>관리기관</span>{shelter.managingAuthorityName ?? '-'} · {shelter.managingAuthorityTelNo ?? '-'}</div>
          <div><span>건축연도</span>{shelter.builtYear ?? '-'}</div>
          <div><span>안전등급</span>{shelter.safetyGrade ?? '-'}</div>
          <div className="readonly-note">위 항목은 관리자만 수정할 수 있습니다.</div>
          {isReInvestigation && (
            <div className="reinvestigation-notice">
              재조사 요청된 대피소입니다. 제출하려면 수정 비밀번호가 필요합니다.
            </div>
          )}
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="field">
            <label>안내문 언어</label>
            <input
              value={signageLanguage}
              onChange={(e) => setSignageLanguage(e.target.value)}
              placeholder="예: 한국어,영어,중국어"
            />
          </div>

          <fieldset className="accessibility">
            <legend>이동약자 편의시설 (시설별 사진 첨부)</legend>

            <AccessibilityRow
              label="장애인 화장실"
              category="TOILET"
              tri={accessibleToilet}
              onTri={setAccessibleToilet}
              pending={newImagesByCategory.TOILET}
              existing={existingByCategory.TOILET ?? []}
              onPick={(e) => handleFilesPicked(e, 'TOILET')}
              onRetry={retryUpload}
              onRemovePending={removeImage}
              onToggleExistingRemoved={toggleExistingRemoved}
            />
            <AccessibilityRow
              label="경사로"
              category="RAMP"
              tri={ramp}
              onTri={setRamp}
              pending={newImagesByCategory.RAMP}
              existing={existingByCategory.RAMP ?? []}
              onPick={(e) => handleFilesPicked(e, 'RAMP')}
              onRetry={retryUpload}
              onRemovePending={removeImage}
              onToggleExistingRemoved={toggleExistingRemoved}
            />
            <AccessibilityRow
              label="엘리베이터"
              category="ELEVATOR"
              tri={elevator}
              onTri={setElevator}
              pending={newImagesByCategory.ELEVATOR}
              existing={existingByCategory.ELEVATOR ?? []}
              onPick={(e) => handleFilesPicked(e, 'ELEVATOR')}
              onRetry={retryUpload}
              onRemovePending={removeImage}
              onToggleExistingRemoved={toggleExistingRemoved}
            />
            <AccessibilityRow
              label="점자블록"
              category="BRAILLE"
              tri={brailleBlock}
              onTri={setBrailleBlock}
              pending={newImagesByCategory.BRAILLE}
              existing={existingByCategory.BRAILLE ?? []}
              onPick={(e) => handleFilesPicked(e, 'BRAILLE')}
              onRetry={retryUpload}
              onRemovePending={removeImage}
              onToggleExistingRemoved={toggleExistingRemoved}
            />

            <div className="field-row etc-row">
              <div className="field" style={{ flex: 1 }}>
                <label>기타 접근성 시설</label>
                <input
                  value={etcFacilities}
                  onChange={(e) => setEtcFacilities(e.target.value)}
                  placeholder="예: 자동문, 수유실, 시각장애인 안내방송"
                />
              </div>
              <FilePickerButton onPick={(e) => handleFilesPicked(e, 'ETC')} />
            </div>
            <CategoryImageStrip
              pending={newImagesByCategory.ETC}
              existing={existingByCategory.ETC ?? []}
              onRetry={retryUpload}
              onRemovePending={removeImage}
              onToggleExistingRemoved={toggleExistingRemoved}
            />
          </fieldset>

          <div className="field">
            <label>조사 메모</label>
            <textarea value={requestNote} onChange={(e) => setRequestNote(e.target.value)} rows={3} />
          </div>

          {(existingByCategory.EXTERIOR?.length ||
            existingByCategory.INTERIOR?.length ||
            existingByCategory.ENTRANCE?.length ||
            existingByCategory.SIGNAGE?.length ||
            existingByCategory.UNKNOWN?.length) && (
              <fieldset className="images">
                <legend>기타 기존 사진</legend>
                <ul className="image-list">
                  {[...(existingByCategory.EXTERIOR ?? []),
                    ...(existingByCategory.INTERIOR ?? []),
                    ...(existingByCategory.ENTRANCE ?? []),
                    ...(existingByCategory.SIGNAGE ?? []),
                    ...(existingByCategory.UNKNOWN ?? []),
                  ].map((img) => (
                    <li key={img.fileId} className={`image-item ${img.removed ? 'status-removed' : ''}`}>
                      <div className="image-thumb">
                        <img src={img.url} alt={img.fileName} />
                        {img.removed && <div className="image-overlay error">삭제 예정</div>}
                      </div>
                      <div className="image-meta">
                        <div className="image-name">{img.fileName}</div>
                        {img.category && (
                          <span className="existing-cat-tag">{CATEGORY_LABEL[img.category as ShelterImageCategory] ?? img.category}</span>
                        )}
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

          {requiresPassword && (
            <div className="field edit-password">
              <label>{isEdit ? '수정 비밀번호' : '재조사 제출 비밀번호'}</label>
              <input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="비밀번호"
                autoComplete="off"
              />
            </div>
          )}

          {error && <div className="modal-error">{error}</div>}
          {failedCount > 0 && (
            <div className="modal-error">실패한 사진 {failedCount}개가 있습니다. 재시도하거나 제거하세요.</div>
          )}

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

type AccessibilityRowProps = {
  label: string
  category: ShelterImageCategory
  tri: TriBool
  onTri: (v: TriBool) => void
  pending: PendingImage[]
  existing: ExistingImage[]
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRetry: (key: string) => void
  onRemovePending: (key: string) => void
  onToggleExistingRemoved: (fileId: number) => void
}

function AccessibilityRow({
  label,
  tri,
  onTri,
  pending,
  existing,
  onPick,
  onRetry,
  onRemovePending,
  onToggleExistingRemoved,
}: AccessibilityRowProps) {
  return (
    <div className="accessibility-row">
      <div className="tri-row">
        <span className="tri-label">{label}</span>
        <div className="tri-buttons">
          {(['true', 'false', ''] as TriBool[]).map((v) => (
            <button
              type="button"
              key={v || 'null'}
              className={tri === v ? 'active' : ''}
              onClick={() => onTri(v)}
            >
              {v === 'true' ? '있음' : v === 'false' ? '없음' : '모름'}
            </button>
          ))}
        </div>
        <FilePickerButton onPick={onPick} />
      </div>
      <CategoryImageStrip
        pending={pending}
        existing={existing}
        onRetry={onRetry}
        onRemovePending={onRemovePending}
        onToggleExistingRemoved={onToggleExistingRemoved}
      />
    </div>
  )
}

function FilePickerButton({ onPick }: { onPick: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="file-picker file-picker-inline">
      <input type="file" accept="image/*" multiple onChange={onPick} />
      📷 사진 추가
    </label>
  )
}

type StripProps = {
  pending: PendingImage[]
  existing: ExistingImage[]
  onRetry: (key: string) => void
  onRemovePending: (key: string) => void
  onToggleExistingRemoved: (fileId: number) => void
}

function CategoryImageStrip({
  pending,
  existing,
  onRetry,
  onRemovePending,
  onToggleExistingRemoved,
}: StripProps) {
  if (pending.length === 0 && existing.length === 0) return null
  return (
    <ul className="image-list image-strip">
      {existing.map((img) => (
        <li key={`existing-${img.fileId}`} className={`image-item ${img.removed ? 'status-removed' : ''}`}>
          <div className="image-thumb">
            <img src={img.url} alt={img.fileName} />
            {img.removed && <div className="image-overlay error">삭제 예정</div>}
          </div>
          <button
            type="button"
            className="image-remove existing-toggle"
            onClick={() => onToggleExistingRemoved(img.fileId)}
          >
            {img.removed ? '복구' : '삭제'}
          </button>
        </li>
      ))}
      {pending.map((img) => (
        <li key={img.key} className={`image-item status-${img.status}`}>
          <div className="image-thumb">
            <img src={img.previewUrl} alt={img.file.name} />
            {img.status === 'uploading' && <div className="image-overlay">업로드 중…</div>}
            {img.status === 'failed' && <div className="image-overlay error">실패</div>}
          </div>
          {img.status === 'failed' && (
            <button type="button" className="retry-btn" onClick={() => onRetry(img.key)}>
              재시도
            </button>
          )}
          <button type="button" className="image-remove" onClick={() => onRemovePending(img.key)}>
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}
