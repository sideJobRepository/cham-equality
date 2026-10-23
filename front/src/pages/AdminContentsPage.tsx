import { useCallback, useEffect, useState } from 'react'
import { deleteContent, fetchContents } from '@/api/contentApi'
import AdminContentEditModal from '@/components/AdminContentEditModal'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import { useFeedback } from '@/hooks/useFeedback'
import {
  CONTENT_TYPE_LABEL,
  type Content,
  type ContentType,
} from '@/types/content'
import './AdminContentsPage.css'

const TYPES = Object.keys(CONTENT_TYPE_LABEL) as ContentType[]

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create'; defaultType?: ContentType }
  | { mode: 'edit'; content: Content }

export default function AdminContentsPage() {
  const { run } = useAdminRequest()
  const { toast, confirm } = useFeedback()
  const [byType, setByType] = useState<Record<ContentType, Content[]> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await run(fetchContents(), '컨텐츠를 불러오지 못했습니다')
    if (result.ok) {
      const grouped = TYPES.reduce((accumulator, contentType) => {
        accumulator[contentType] = result.data.filter((content) => content.type === contentType)
        return accumulator
      }, {} as Record<ContentType, Content[]>)
      setByType(grouped)
    } else if (result.message) {
      setError(result.message)
    }
    setLoading(false)
  }, [run])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (content: Content) => {
    const confirmed = await confirm({
      title: '컨텐츠 삭제',
      description: `"${content.name}" 컨텐츠를 삭제할까요?`,
      confirmLabel: '삭제',
      destructive: true,
    })
    if (!confirmed) return
    const result = await run(deleteContent(content.id), '삭제 실패')
    if (result.ok) {
      toast('삭제되었습니다')
      load()
    } else if (result.message) {
      toast(result.message, 'error')
    }
  }

  return (
    <div className="admin-contents-page">
      <header className="admin-header">
        <div>
          <h1>컨텐츠 관리</h1>
          <p className="subtitle">인앱 팝업·단체활동·시민참여 컨텐츠를 타입별로 관리합니다.</p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={() => setModal({ mode: 'create' })}
          >
            + 신규 등록
          </button>
        </div>
      </header>

      {loading && <div className="state">불러오는 중…</div>}
      {error && <div className="state error">{error}</div>}

      {byType && !loading && !error && (
        <div className="type-sections">
          {TYPES.map((contentType) => (
            <section key={contentType} className="type-section" data-type={contentType}>
              <header className="type-section-header">
                <h2>{CONTENT_TYPE_LABEL[contentType]}</h2>
                <div className="type-section-meta">
                  <span className="count">{byType[contentType].length}건</span>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setModal({ mode: 'create', defaultType: contentType })}
                  >
                    + 추가
                  </button>
                </div>
              </header>

              {byType[contentType].length === 0 ? (
                <div className="empty">등록된 컨텐츠가 없습니다</div>
              ) : (
                <div className="content-grid">
                  {byType[contentType].map((content) => (
                    <article key={content.id} className="content-card">
                      <div className="content-card-thumb">
                        {content.imageUrl ? (
                          <img
                            src={content.imageUrl}
                            alt=""
                            onError={(errorEvent) => {
                              const imageElement = errorEvent.currentTarget
                              imageElement.style.display = 'none'
                              imageElement.parentElement?.classList.add('no-image')
                            }}
                          />
                        ) : (
                          <span className="no-image-label">No Image</span>
                        )}
                      </div>
                      <div className="content-card-body">
                        <div className="content-card-title" title={content.name}>{content.name}</div>
                        {content.url && (
                          <a
                            className="content-card-url"
                            href={content.url}
                            target="_blank"
                            rel="noreferrer"
                            title={content.url}
                          >
                            {content.url}
                          </a>
                        )}
                        {(content.displayStartDate || content.displayEndDate) && (
                          <div className="content-card-dates">
                            {content.displayStartDate ?? '…'} ~ {content.displayEndDate ?? '…'}
                          </div>
                        )}
                      </div>
                      <div className="content-card-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => setModal({ mode: 'edit', content })}
                        >
                          편집
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(content)}
                        >
                          삭제
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {modal.mode !== 'closed' && (
        <AdminContentEditModal
          content={modal.mode === 'edit' ? modal.content : null}
          defaultType={modal.mode === 'create' ? modal.defaultType : undefined}
          onClose={() => setModal({ mode: 'closed' })}
          onSaved={() => {
            const wasEdit = modal.mode === 'edit'
            setModal({ mode: 'closed' })
            toast(wasEdit ? '수정되었습니다' : '등록되었습니다')
            load()
          }}
        />
      )}
    </div>
  )
}
