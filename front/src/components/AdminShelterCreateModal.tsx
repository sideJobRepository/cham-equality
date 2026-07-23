import { useEffect, useState } from 'react'
import {
  createAdminShelter,
  UnauthorizedError,
  type AdminShelterCreateRequest,
} from '@/api/adminApi'
import { fetchRegions, type RegionOption } from '@/api/regionApi'
import { SHELTER_TYPE_LABEL, type ShelterType } from '@/types/shelter'
import './AdminShelterEditModal.css'

type Props = {
  onClose: () => void
  onSaved: () => void
  onUnauthorized: () => void
}

const TYPE_OPTIONS: { value: ShelterType; label: string }[] = (
  Object.entries(SHELTER_TYPE_LABEL) as [ShelterType, string][]
).map(([value, label]) => ({ value, label }))

const numberOrNull = (v: string): number | null => (v.trim() ? Number(v) : null)
const textOrNull = (v: string): string | null => (v.trim() ? v.trim() : null)

export default function AdminShelterCreateModal({ onClose, onSaved, onUnauthorized }: Props) {
  const [name, setName] = useState('')
  const [englishName, setEnglishName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [oldAddress, setOldAddress] = useState('')
  const [englishAddress, setEnglishAddress] = useState('')
  const [shelterType, setShelterType] = useState<ShelterType | ''>('')
  // 시/도 → 시/군/구 → 읍/면/동 카스케이드. 각 단계의 옵션 목록과 선택값을 따로 관리한다.
  const [sido, setSido] = useState<RegionOption[]>([])
  const [sigungu, setSigungu] = useState<RegionOption[]>([])
  const [eupmyeondong, setEupmyeondong] = useState<RegionOption[]>([])
  const [sidoId, setSidoId] = useState('')
  const [sigunguId, setSigunguId] = useState('')
  const [eupmyeondongId, setEupmyeondongId] = useState('')
  const [regionError, setRegionError] = useState<string | null>(null)
  const [area, setArea] = useState('')
  const [capacity, setCapacity] = useState('')
  const [builtYear, setBuiltYear] = useState('')
  const [safetyGrade, setSafetyGrade] = useState('')
  const [managingAuthorityName, setManagingAuthorityName] = useState('')
  const [managingAuthorityTelNo, setManagingAuthorityTelNo] = useState('')
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

  // 최상위(시/도) 목록은 마운트 시 한 번 로드.
  useEffect(() => {
    fetchRegions(0)
      .then(setSido)
      .catch(() => setRegionError('행정구역을 불러오지 못했습니다.'))
  }, [])

  const handleSidoChange = async (value: string) => {
    setSidoId(value)
    setSigunguId('')
    setEupmyeondongId('')
    setSigungu([])
    setEupmyeondong([])
    if (!value) return
    try {
      setSigungu(await fetchRegions(1, Number(value)))
    } catch {
      setRegionError('행정구역을 불러오지 못했습니다.')
    }
  }

  const handleSigunguChange = async (value: string) => {
    setSigunguId(value)
    setEupmyeondongId('')
    setEupmyeondong([])
    if (!value) return
    try {
      setEupmyeondong(await fetchRegions(2, Number(value)))
    } catch {
      setRegionError('행정구역을 불러오지 못했습니다.')
    }
  }

  // 선택한 것 중 가장 하위 depth의 regionId를 사용한다.
  const selectedRegionId = eupmyeondongId || sigunguId || sidoId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('대피소 이름은 필수입니다.')
      return
    }
    if (!address.trim() && !oldAddress.trim()) {
      setError('주소(도로명 또는 구주소)는 필수입니다.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const body: AdminShelterCreateRequest = {
        name: name.trim(),
        englishName: textOrNull(englishName),
        description: textOrNull(description),
        regionId: selectedRegionId ? Number(selectedRegionId) : null,
        address: textOrNull(address),
        oldAddress: textOrNull(oldAddress),
        englishAddress: textOrNull(englishAddress),
        shelterType: shelterType || null,
        area: numberOrNull(area),
        capacity: numberOrNull(capacity),
        builtYear: numberOrNull(builtYear),
        safetyGrade: numberOrNull(safetyGrade),
        managingAuthorityName: textOrNull(managingAuthorityName),
        managingAuthorityTelNo: textOrNull(managingAuthorityTelNo),
      }
      await createAdminShelter(body)
      onSaved()
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) onUnauthorized()
      else setError(err instanceof Error ? err.message : '추가 실패')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shelter-edit-backdrop">
      <div className="shelter-edit-modal" onClick={(e) => e.stopPropagation()}>
        <header className="shelter-edit-header">
          <h2>대피소 추가</h2>
          <button type="button" className="shelter-edit-close" onClick={onClose}>✕</button>
        </header>

        <div className="shelter-edit-info">
          입력한 주소를 기준으로 지도 위치가 자동으로 설정됩니다.
        </div>

        <form className="shelter-edit-body" onSubmit={handleSubmit}>
          <div className="field">
            <label>시설명 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field">
            <label>영문 시설명</label>
            <input value={englishName} onChange={(e) => setEnglishName(e.target.value)} />
          </div>

          <div className="field">
            <label>행정구역</label>
            <div className="field-row">
              <select value={sidoId} onChange={(e) => handleSidoChange(e.target.value)}>
                <option value="">시/도</option>
                {sido.map((r) => (
                  <option key={r.regionId} value={r.regionId}>{r.name}</option>
                ))}
              </select>
              <select
                value={sigunguId}
                onChange={(e) => handleSigunguChange(e.target.value)}
                disabled={!sidoId}
              >
                <option value="">시/군/구</option>
                {sigungu.map((r) => (
                  <option key={r.regionId} value={r.regionId}>{r.name}</option>
                ))}
              </select>
              <select
                value={eupmyeondongId}
                onChange={(e) => setEupmyeondongId(e.target.value)}
                disabled={!sigunguId}
              >
                <option value="">읍/면/동</option>
                {eupmyeondong.map((r) => (
                  <option key={r.regionId} value={r.regionId}>{r.name}</option>
                ))}
              </select>
            </div>
            {regionError && <span className="field-hint error">{regionError}</span>}
          </div>

          <div className="field">
            <label>도로명 주소</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="field">
            <label>구주소(지번)</label>
            <input value={oldAddress} onChange={(e) => setOldAddress(e.target.value)} />
          </div>

          <div className="field">
            <label>영문 주소</label>
            <input value={englishAddress} onChange={(e) => setEnglishAddress(e.target.value)} />
          </div>

          <div className="field">
            <label>대피소 타입</label>
            <select
              value={shelterType}
              onChange={(e) => setShelterType((e.target.value || '') as ShelterType | '')}
            >
              <option value="">선택 안 함</option>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label>면적(㎡)</label>
              <input type="number" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div className="field">
              <label>수용 인원</label>
              <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
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
            <label>관리기관명</label>
            <input
              value={managingAuthorityName}
              onChange={(e) => setManagingAuthorityName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>관리기관 전화번호</label>
            <input
              value={managingAuthorityTelNo}
              onChange={(e) => setManagingAuthorityTelNo(e.target.value)}
            />
          </div>

          <div className="field">
            <label>설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {error && <div className="shelter-edit-error">{error}</div>}

          <footer className="shelter-edit-footer">
            <button type="button" onClick={onClose} disabled={submitting}>취소</button>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? '추가 중…' : '추가'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
