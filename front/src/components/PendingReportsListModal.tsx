import { useEffect, useState } from 'react'
import {
  fetchPendingReportsByShelter,
  type ShelterReportSummary,
} from '../api/shelterApi'
import type { Shelter } from '../types/shelter'
import './PendingReportsListModal.css'

type Props = {
  shelter: Shelter
  onClose: () => void
  onSelect: (reportId: number) => void
}

function yn(v: boolean | null): string {
  if (v === null || v === undefined) return '-'
  return v ? 'O' : 'X'
}

export default function PendingReportsListModal({ shelter, onClose, onSelect }: Props) {
  const [reports, setReports] = useState<ShelterReportSummary[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchPendingReportsByShelter(shelter.id)
      .then(setReports)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '목록 조회 실패'),
      )
      .finally(() => setLoading(false))
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

  return (
    <div className="pending-backdrop" onClick={onClose}>
      <div className="pending-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pending-header">
          <div>
            <h2>승인 대기 중인 제출</h2>
            <p className="pending-sub">{shelter.name}</p>
          </div>
          <button type="button" className="pending-close" onClick={onClose}>✕</button>
        </header>

        <div className="pending-body">
          {loading && <div className="pending-state">불러오는 중…</div>}
          {error && <div className="pending-state pending-error">{error}</div>}
          {reports && !loading && !error && reports.length === 0 && (
            <div className="pending-state">대기 중인 제출이 없습니다</div>
          )}
          {reports && !loading && reports.length > 0 && (
            <ul className="pending-list">
              {reports.map((r) => (
                <li key={r.id} className="pending-item" onClick={() => onSelect(r.id)}>
                  <div className="pending-item-head">
                    <span className="pending-item-id">#{r.id}</span>
                    <span className="pending-item-date">
                      {r.createDate?.slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                  <div className="pending-item-body">
                    <div className="pending-item-grid">
                      <span>화장실 {yn(r.accessibleToilet)}</span>
                      <span>경사로 {yn(r.ramp)}</span>
                      <span>엘베 {yn(r.elevator)}</span>
                      <span>점자 {yn(r.brailleBlock)}</span>
                    </div>
                    {r.requestNote && <div className="pending-item-note">{r.requestNote}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
