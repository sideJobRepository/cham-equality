import { useEffect, useState } from 'react'
import { updateAdminShelter } from '@/api/adminApi'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import { SHELTER_TYPE_LABEL, type Shelter, type ShelterType } from '@/types/shelter'
import './AdminShelterEditModal.css'

type Props = {
  shelter: Shelter
  onClose: () => void
  onSaved: () => void
}

const TYPE_OPTIONS: { value: ShelterType; label: string }[] = (
  Object.entries(SHELTER_TYPE_LABEL) as [ShelterType, string][]
).map(([value, label]) => ({ value, label }))

export default function AdminShelterEditModal({ shelter, onClose, onSaved }: Props) {
  const { run } = useAdminRequest()
  const [name, setName] = useState(shelter.name ?? '')
  const [builtYear, setBuiltYear] = useState<string>(shelter.builtYear?.toString() ?? '')
  const [shelterType, setShelterType] = useState<ShelterType | ''>(shelter.shelterType ?? '')
  const [safetyGrade, setSafetyGrade] = useState<string>(shelter.safetyGrade?.toString() ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await run(
      updateAdminShelter(shelter.id, {
        name: name.trim() || null,
        builtYear: builtYear ? Number(builtYear) : null,
        shelterType: shelterType || null,
        safetyGrade: safetyGrade ? Number(safetyGrade) : null,
      }),
      '저장 실패',
    )
    setSubmitting(false)
    if (result.ok) onSaved()
    else if (result.message) setError(result.message)
  }

  return (
    <div className="shelter-edit-backdrop" onClick={onClose}>
      <div className="shelter-edit-modal" onClick={(clickEvent) => clickEvent.stopPropagation()}>
        <header className="shelter-edit-header">
          <h2>대피소 #{shelter.id} 편집</h2>
          <button type="button" className="shelter-edit-close" onClick={onClose}>✕</button>
        </header>

        <div className="shelter-edit-info">
          <div><span>주소</span>{shelter.address ?? '-'}</div>
          {shelter.oldAddress && <div><span>구주소</span>{shelter.oldAddress}</div>}
        </div>

        <form className="shelter-edit-body" onSubmit={handleSubmit}>
          <div className="field">
            <label>시설명</label>
            <input value={name} onChange={(changeEvent) => setName(changeEvent.target.value)} />
          </div>

          <div className="field">
            <label>건축 연도</label>
            <input type="number" value={builtYear} onChange={(changeEvent) => setBuiltYear(changeEvent.target.value)} />
          </div>

          <div className="field">
            <label>대피소 타입</label>
            <select
              value={shelterType}
              onChange={(changeEvent) => setShelterType((changeEvent.target.value || '') as ShelterType | '')}
            >
              <option value="">선택 안 함</option>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>안전 등급 (내진설계)</label>
            <input
              type="number"
              value={safetyGrade}
              onChange={(changeEvent) => setSafetyGrade(changeEvent.target.value)}
            />
          </div>

          {error && <div className="shelter-edit-error">{error}</div>}

          <footer className="shelter-edit-footer">
            <button type="button" onClick={onClose} disabled={submitting}>취소</button>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? '저장 중…' : '저장'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
