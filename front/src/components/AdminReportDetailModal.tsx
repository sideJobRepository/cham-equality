import { useCallback, useEffect, useState } from 'react'
import {
  approveReport,
  downloadFilesAsZip,
  fetchReportDetail,
  getDownloadUrl,
  rejectReport,
  requestReInvestigation,
  type ShelterReportImageView,
} from '@/api/adminApi'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import { useFeedback } from '@/hooks/useFeedback'
import { usePagedList } from '@/hooks/usePagedList'
import { saveBlob, triggerDownload } from '@/lib/file'
import './AdminReportDetailModal.css'

type Props = {
  reportId: number
  onClose: () => void
  onActionDone: () => void
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

function yn(value: boolean | null): string {
  if (value === null || value === undefined) return '-'
  return value ? 'O' : 'X'
}

export default function AdminReportDetailModal({
  reportId,
  onClose,
  onActionDone,
}: Props) {
  const { run } = useAdminRequest()
  const { toast, confirm } = useFeedback()
  // reportId가 바뀌면 새로 불러오고, 이전 id의 늦은 응답은 버린다(usePagedList 요청 순번).
  const fetchDetail = useCallback(() => fetchReportDetail(reportId), [reportId])
  const { data: detail, loading, error } = usePagedList(fetchDetail, '상세 조회 실패')
  const [processing, setProcessing] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [zipping, setZipping] = useState(false)

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

  // 확인 → 처리 → 성공 토스트 → 목록 갱신. 실패는 오류 토스트로 알리고 모달은 그대로 둔다.
  const runAction = async (
    request: () => Promise<unknown>,
    successMessage: string,
    fallbackMessage: string,
  ) => {
    setProcessing(true)
    const result = await run(request(), fallbackMessage)
    setProcessing(false)
    if (result.ok) {
      toast(successMessage)
      onActionDone()
    } else if (result.message) {
      toast(result.message, 'error')
    }
  }

  const handleApprove = async () => {
    const isReApproval = detail?.shelterSurveyStatus === 'RE_INVESTIGATION'
    const confirmed = await confirm({
      title: isReApproval ? '재조사 승인' : '리포트 승인',
      description: isReApproval
        ? '재조사 승인입니다. 이전에 승인된 사진은 삭제 상태로 전환되어 일일 정리 배치가 수거합니다. 계속할까요?'
        : '이 리포트를 승인하고 대피소 정보에 반영할까요?',
      confirmLabel: '승인',
    })
    if (!confirmed) return
    await runAction(() => approveReport(reportId), '승인했습니다', '승인 실패')
  }

  const handleReject = async () => {
    const confirmed = await confirm({
      title: '리포트 반려',
      description: '반려 시 첨부된 사진은 삭제 대상으로 전환됩니다. 계속할까요?',
      confirmLabel: '반려',
      destructive: true,
    })
    if (!confirmed) return
    await runAction(() => rejectReport(reportId), '반려했습니다', '반려 실패')
  }

  const handleReInvestigate = async () => {
    const confirmed = await confirm({
      title: '재조사 요청',
      description: '재조사 요청 시 시민이 다시 제출할 수 있게 됩니다. 진행할까요?',
      confirmLabel: '재조사 요청',
    })
    if (!confirmed) return
    await runAction(() => requestReInvestigation(reportId), '재조사를 요청했습니다', '재조사 요청 실패')
  }

  const handleDownload = async (image: ShelterReportImageView) => {
    setDownloadingId(image.fileId)
    const result = await run(getDownloadUrl(image.fileId), '다운로드 실패')
    setDownloadingId(null)
    if (result.ok) triggerDownload(result.data, image.fileName)
    else if (result.message) toast(result.message, 'error')
  }

  const handleDownloadAll = async () => {
    if (!detail || detail.images.length === 0) return
    const zipName = `report-${detail.id}.zip`
    setZipping(true)
    const result = await run(
      downloadFilesAsZip(detail.images.map((image) => image.fileId), zipName),
      '일괄 다운로드 실패',
    )
    setZipping(false)
    if (result.ok) saveBlob(result.data, zipName)
    else if (result.message) toast(result.message, 'error')
  }

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <div className="detail-modal" onClick={(clickEvent) => clickEvent.stopPropagation()}>
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
                <Row label="조사자">{detail.reporter ?? '-'}</Row>
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
                    {detail.images.map((image) => (
                      <figure key={image.fileId} className="image-card">
                        <a href={image.url} target="_blank" rel="noopener noreferrer">
                          <img src={image.url} alt={image.fileName} />
                        </a>
                        <figcaption>
                          {image.category && (
                            <span className="cat-tag">{CATEGORY_LABEL[image.category] ?? image.category}</span>
                          )}
                          {image.description && <span className="desc">{image.description}</span>}
                          <button
                            type="button"
                            className="download-btn"
                            disabled={downloadingId === image.fileId}
                            onClick={() => handleDownload(image)}
                          >
                            {downloadingId === image.fileId ? '받는 중…' : '다운로드'}
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
        {detail && detail.requestStatus === 'APPROVED' && (
          <footer className="detail-footer">
            <button type="button" className="reinvestigate-btn" disabled={processing} onClick={handleReInvestigate}>
              재조사 요청
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
