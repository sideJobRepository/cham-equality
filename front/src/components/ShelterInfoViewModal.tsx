import { useEffect, useMemo, useState } from 'react'
import {
  fetchApprovedReportsByShelter,
  fetchShelterReportDetail,
  type ShelterImageCategory,
  type ShelterReportDetail,
  type ShelterReportImageView,
} from '../api/shelterApi'
import { SHELTER_TYPE_LABEL, type Shelter } from '../types/shelter'
import './ShelterInfoViewModal.css'

type Props = {
  shelter: Shelter
  onClose: () => void
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

const ACCESSIBILITY_ORDER: ShelterImageCategory[] = ['TOILET', 'RAMP', 'ELEVATOR', 'BRAILLE', 'ETC']

function yn(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return '-'
  return v ? 'O' : 'X'
}

export default function ShelterInfoViewModal({ shelter, onClose }: Props) {
  const [detail, setDetail] = useState<ShelterReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchApprovedReportsByShelter(shelter.id)
      .then(async (list) => {
        if (cancelled) return
        if (list.length === 0) {
          setDetail(null)
          return
        }
        const d = await fetchShelterReportDetail(list[0].id)
        if (!cancelled) setDetail(d)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '조회 실패')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [shelter.id])

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

  const imagesByCategory = useMemo(() => {
    const map: Record<string, ShelterReportImageView[]> = {}
    if (!detail) return map
    detail.images.forEach((img) => {
      const key = img.category ?? 'ETC'
      if (!map[key]) map[key] = []
      map[key].push(img)
    })
    return map
  }, [detail])

  return (
    <div className="info-view-backdrop" onClick={onClose}>
      <div className="info-view-modal" onClick={(e) => e.stopPropagation()}>
        <header className="info-view-header">
          <div>
            <h2>{shelter.name}</h2>
            <p className="info-view-sub">
              {shelter.shelterType ? SHELTER_TYPE_LABEL[shelter.shelterType] : '타입 미지정'}
              {' · 조사 완료'}
            </p>
          </div>
          <button type="button" className="info-view-close" onClick={onClose}>✕</button>
        </header>

        <div className="info-view-body">
          <section className="info-shelter-meta">
            <Row label="주소">{shelter.address ?? '-'}</Row>
            {shelter.oldAddress && <Row label="구주소">{shelter.oldAddress}</Row>}
            <Row label="관리기관">
              {shelter.managingAuthorityName ?? '-'} · {shelter.managingAuthorityTelNo ?? '-'}
            </Row>
            <Row label="면적/수용">
              {shelter.area ?? '-'}㎡ · {shelter.capacity ?? '-'}명
            </Row>
            <Row label="건축연도">{shelter.builtYear ?? '-'}</Row>
          </section>

          {loading && <div className="state">불러오는 중…</div>}
          {error && <div className="state error">{error}</div>}

          {!loading && !error && !detail && (
            <div className="state">승인된 조사 정보가 아직 없습니다.</div>
          )}

          {detail && !loading && !error && (
            <>
              <section className="info-report-meta">
                <h3>조사 정보</h3>
                <Row label="안전등급">{shelter.safetyGrade ?? '-'}</Row>
                <Row label="안내문 언어">{detail.signageLanguage ?? '-'}</Row>
                <Row label="장애인 화장실">{yn(detail.accessibleToilet)}</Row>
                <Row label="경사로">{yn(detail.ramp)}</Row>
                <Row label="엘리베이터">{yn(detail.elevator)}</Row>
                <Row label="점자블록">{yn(detail.brailleBlock)}</Row>
                <Row label="기타 시설">{detail.etcFacilities ?? '-'}</Row>
                <Row label="조사 메모">{detail.requestNote ?? '-'}</Row>
                <Row label="승인 시점">
                  {detail.createDate?.slice(0, 16).replace('T', ' ')}
                </Row>
              </section>

              <section className="info-images">
                <h3>첨부 사진 ({detail.images.length}장)</h3>
                {detail.images.length === 0 ? (
                  <p className="no-images">첨부된 사진이 없습니다.</p>
                ) : (
                  ACCESSIBILITY_ORDER.map((cat) => {
                    const list = imagesByCategory[cat]
                    if (!list || list.length === 0) return null
                    return (
                      <div key={cat} className="info-image-group">
                        <h4>{CATEGORY_LABEL[cat]}</h4>
                        <div className="info-image-grid">
                          {list.map((img) => (
                            <a
                              key={img.fileId}
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="info-image-card"
                            >
                              <img src={img.url} alt={img.fileName} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </section>
            </>
          )}
        </div>

        <footer className="info-view-footer">
          <button type="button" onClick={onClose}>닫기</button>
        </footer>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="info-row">
      <span className="info-row-label">{label}</span>
      <span className="info-row-value">{children}</span>
    </div>
  )
}
