import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearAdminPassword,
  getAdminPassword,
  UnauthorizedError,
} from '@/api/adminApi'
import {
  deleteContent,
  fetchContents,
} from '@/api/contentApi'
import AdminLayout from '@/components/AdminLayout'
import AdminContentEditModal from '@/components/AdminContentEditModal'
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
  const navigate = useNavigate()
  const [byType, setByType] = useState<Record<ContentType, Content[]> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [flash, setFlash] = useState<string | null>(null)

  const handleUnauthorized = useCallback(() => {
    clearAdminPassword()
    navigate('/admin/login', { replace: true })
  }, [navigate])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const contents = await fetchContents()
      const next = TYPES.reduce((acc, t) => {
        acc[t] = contents.filter((c) => c.type === t)
        return acc
      }, {} as Record<ContentType, Content[]>)
      setByType(next)
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        handleUnauthorized()
        return
      }
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }, [handleUnauthorized])

  useEffect(() => {
    if (!getAdminPassword()) {
      navigate('/admin/login', { replace: true })
      return
    }
    load()
  }, [load, navigate])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 2500)
    return () => clearTimeout(t)
  }, [flash])

  const handleDelete = async (c: Content) => {
    if (!confirm(`"${c.name}" 컨텐츠를 삭제할까요?`)) return
    try {
      await deleteContent(c.id)
      setFlash('삭제되었습니다')
      load()
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) handleUnauthorized()
      else setError(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  return (
    <AdminLayout>
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

        {flash && <div className="content-flash">{flash}</div>}
        {loading && <div className="state">불러오는 중…</div>}
        {error && <div className="state error">{error}</div>}

        {byType && !loading && !error && (
          <div className="type-sections">
            {TYPES.map((t) => (
              <section key={t} className="type-section" data-type={t}>
                <header className="type-section-header">
                  <h2>{CONTENT_TYPE_LABEL[t]}</h2>
                  <div className="type-section-meta">
                    <span className="count">{byType[t].length}건</span>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setModal({ mode: 'create', defaultType: t })}
                    >
                      + 추가
                    </button>
                  </div>
                </header>

                {byType[t].length === 0 ? (
                  <div className="empty">등록된 컨텐츠가 없습니다</div>
                ) : (
                  <div className="content-grid">
                    {byType[t].map((c) => (
                      <article key={c.id} className="content-card">
                        <div className="content-card-thumb">
                          {c.imageUrl ? (
                            <img
                              src={c.imageUrl}
                              alt=""
                              onError={(e) => {
                                const img = e.currentTarget
                                img.style.display = 'none'
                                img.parentElement?.classList.add('no-image')
                              }}
                            />
                          ) : (
                            <span className="no-image-label">No Image</span>
                          )}
                        </div>
                        <div className="content-card-body">
                          <div className="content-card-title" title={c.name}>{c.name}</div>
                          {c.url && (
                            <a
                              className="content-card-url"
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              title={c.url}
                            >
                              {c.url}
                            </a>
                          )}
                          {(c.displayStartDate || c.displayEndDate) && (
                            <div className="content-card-dates">
                              {c.displayStartDate ?? '…'} ~ {c.displayEndDate ?? '…'}
                            </div>
                          )}
                        </div>
                        <div className="content-card-actions">
                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() => setModal({ mode: 'edit', content: c })}
                          >
                            편집
                          </button>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleDelete(c)}
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
              setFlash(wasEdit ? '수정되었습니다' : '등록되었습니다')
              load()
            }}
            onUnauthorized={handleUnauthorized}
          />
        )}
      </div>
    </AdminLayout>
  )
}
