import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearAdminPassword,
  getAdminPassword,
  UnauthorizedError,
} from '@/api/adminApi'
import { deleteManual, fetchManuals } from '@/api/manualApi'
import AdminLayout from '@/components/AdminLayout'
import AdminManualEditModal from '@/components/AdminManualEditModal'
import { MANUAL_LANGUAGE_LABEL, type ManualListItem } from '@/types/manual'
import './AdminManualsPage.css'

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; id: number }

export default function AdminManualsPage() {
  const navigate = useNavigate()
  const [manuals, setManuals] = useState<ManualListItem[] | null>(null)
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
      setManuals(await fetchManuals())
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

  const handleDelete = async (m: ManualListItem) => {
    if (!confirm(`"${m.title}" 매뉴얼을 삭제할까요?`)) return
    try {
      await deleteManual(m.id)
      setFlash('삭제되었습니다')
      load()
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) handleUnauthorized()
      else setError(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  return (
    <AdminLayout>
      <div className="admin-manuals-page">
        <header className="admin-header">
          <div>
            <h1>매뉴얼 관리</h1>
            <p className="subtitle">언어별 재난행동요령 매뉴얼을 에디터로 작성·관리합니다.</p>
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

        {flash && <div className="manual-flash">{flash}</div>}
        {loading && <div className="manual-state">불러오는 중…</div>}
        {error && <div className="manual-state error">{error}</div>}

        {manuals && !loading && !error && (
          manuals.length === 0 ? (
            <div className="manual-empty">등록된 매뉴얼이 없습니다</div>
          ) : (
            <table className="manual-table">
              <thead>
                <tr>
                  <th className="col-lang">언어</th>
                  <th className="col-title">제목</th>
                  <th className="col-actions" />
                </tr>
              </thead>
              <tbody>
                {manuals.map((m) => (
                  <tr key={m.id}>
                    <td className="col-lang">
                      <span className="lang-badge">{MANUAL_LANGUAGE_LABEL[m.language]}</span>
                    </td>
                    <td className="col-title" title={m.title}>{m.title}</td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => setModal({ mode: 'edit', id: m.id })}
                      >
                        편집
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDelete(m)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {modal.mode !== 'closed' && (
          <AdminManualEditModal
            manualId={modal.mode === 'edit' ? modal.id : null}
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
