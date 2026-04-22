import { useEffect, useState } from 'react'
import {
  approveReport,
  downloadFilesAsZip,
  fetchReportDetail,
  getDownloadUrl,
  rejectReport,
  UnauthorizedError,
  type ShelterReportDetail,
  type ShelterReportImageView,
} from '../api/adminApi'
import { saveBlob, triggerDownload } from '../lib/file'
import './AdminReportDetailModal.css'

type Props = {
  reportId: number
  onClose: () => void
  onActionDone: () => void
  onUnauthorized: () => void
}

const CATEGORY_LABEL: Record<string, string> = {
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

function yn(v: boolean | null): string {
  if (v === null || v === undefined) return '-'
  return v ? 'O' : 'X'
}

export default function AdminReportDetailModal({
  reportId,
  onClose,
  onActionDone,
  onUnauthorized,
}: Props) {
  const [detail, setDetail] = useState<ShelterReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [zipping, setZipping] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchReportDetail(reportId)
      .then(setDetail)
      .catch((e: unknown) => {
        if (e instanceof UnauthorizedError) {
          onUnauthorized()
          return
        }
        setError(e instanceof Error ? e.message : '상세 조회 실패')
      })
      .finally(() => setLoading(false))
  }, [reportId, onUnauthorized])

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

  const handleApprove = async () => {
    if (!confirm('이 리포트를 승인하고 대피소 정보에 반영할까요?')) return
    setProcessing(true)
    try {
      await approveReport(reportId)
      onActionDone()
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) onUnauthorized()
      else alert(e instanceof Error ? e.message : '승인 실패')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = async (img: ShelterReportImageView) => {
    setDownloadingId(img.fileId)
    try {
      const url = await getDownloadUrl(img.fileId)
      triggerDownload(url, img.fileName)
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) onUnauthorized()
      else alert(e instanceof Error ? e.message : '다운로드 실패')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDownloadAll = async () => {
    if (!detail || detail.images.length === 0) return
    const zipName = `report-${detail.id}.zip`
    setZipping(true)
    try {
      const blob = await downloadFilesAsZip(
        detail.images.map((img) => img.fileId),
        zipName,
      )
      saveBlob(blob, zipName)
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) onUnauthorized()
      else alert(e instanceof Error ? e.message : '일괄 다운로드 실패')
    } finally {
      setZipping(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('반려 시 첨부된 사진은 삭제 대상으로 전환됩니다. 계속할까요?')) return
    setProcessing(true)
    try {
      await rejectReport(reportId)
      onActionDone()
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) onUnauthorized()
      else alert(e instanceof Error ? e.message : '반려 실패')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <header className="detail-header">
          <div>
            <h2>리포트 #{reportId}</h2>
            {detail && (
              <p className="detail-sub">
                대피소 #{detail.shelterId} · {detail.shelterName ?? '-'}
                <br />
                {detail.shelterAddress ?? ''}
              </p>
            )}
          </div>
          <button type="button" className="detail-close" onClick={onClose}>✕</button>
        </header>

        <div className="detail-body">
          {loading && <div className="state">불러오는 중…</div>}
          {error && <div className="state error">{error}</div>}

          {detail && !loading && !error && (
            <>
              <section className="fields">
                <Row label="상태">
                  <span className={`badge badge-${detail.requestStatus.toLowerCase()}`}>
                    {detail.requestStatus === 'PENDING' ? '대기'
                      : detail.requestStatus === 'APPROVED' ? '승인' : '반려'}
                  </span>
                </Row>
                <Row label="접수">{detail.createDate?.slice(0, 16).replace('T', ' ')}</Row>
                <Row label="시설명">{detail.name ?? '-'}</Row>
                <Row label="건축 연도">{detail.builtYear ?? '-'}</Row>
                <Row label="안전등급">{detail.safetyGrade ?? '-'}</Row>
                <Row label="안내문 언어">{detail.signageLanguage ?? '-'}</Row>
                <Row label="장애인화장실">{yn(detail.accessibleToilet)}</Row>
                <Row label="경사로">{yn(detail.ramp)}</Row>
                <Row label="엘리베이터">{yn(detail.elevator)}</Row>
                <Row label="점자블록">{yn(detail.brailleBlock)}</Row>
                <Row label="기타시설">{detail.etcFacilities ?? '-'}</Row>
                <Row label="조사 메모">{detail.requestNote ?? '-'}</Row>
              </section>

              <section className="images-section">
                <div className="images-header">
                  <h3>첨부 사진 ({detail.images.length}장)</h3>
                  {detail.images.length > 0 && (
                    <button
                      type="button"
                      className="zip-btn"
                      onClick={handleDownloadAll}
                      disabled={zipping}
                    >
                      {zipping ? '다운로드 중…' : '전체 다운로드'}
                    </button>
                  )}
                </div>
                {detail.images.length === 0 ? (
                  <p className="no-images">첨부된 사진이 없습니다.</p>
                ) : (
                  <div className="images-grid">
                    {detail.images.map((img) => (
                      <figure key={img.fileId} className="image-card">
                        <a href={img.url} target="_blank" rel="noopener noreferrer">
                          <img src={img.url} alt={img.fileName} />
                        </a>
                        <figcaption>
                          {img.category && (
                            <span className="cat-tag">{CATEGORY_LABEL[img.category] ?? img.category}</span>
                          )}
                          {img.description && <span className="desc">{img.description}</span>}
                          <button
                            type="button"
                            className="download-btn"
                            disabled={downloadingId === img.fileId}
                            onClick={() => handleDownload(img)}
                          >
                            {downloadingId === img.fileId ? '받는 중…' : '다운로드'}
                          </button>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {detail && detail.requestStatus === 'PENDING' && (
          <footer className="detail-footer">
            <button type="button" className="reject-btn" disabled={processing} onClick={handleReject}>
              반려
            </button>
            <button type="button" className="approve-btn" disabled={processing} onClick={handleApprove}>
              승인
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <span className="row-value">{children}</span>
    </div>
  )
}
