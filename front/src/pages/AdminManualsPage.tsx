import { useState } from 'react'
import { deleteManual, fetchManuals } from '@/api/manualApi'
import AdminManualEditModal from '@/components/AdminManualEditModal'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import { useFeedback } from '@/hooks/useFeedback'
import { usePagedList } from '@/hooks/usePagedList'
import { MANUAL_LANGUAGE_LABEL, type ManualListItem } from '@/types/manual'
import './AdminManualsPage.css'

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; id: number }

export default function AdminManualsPage() {
  const { run } = useAdminRequest()
  const { toast, confirm } = useFeedback()
  // fetchManuals는 모듈 수준 함수라 참조가 고정돼 마운트 때 한 번만 부른다(갱신은 reload).
  const { data: manuals, loading, error, reload } = usePagedList(fetchManuals, '매뉴얼을 불러오지 못했습니다')
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })

  const handleDelete = async (manual: ManualListItem) => {
    const confirmed = await confirm({
      title: '매뉴얼 삭제',
      description: `"${manual.title}" 매뉴얼을 삭제할까요?`,
      confirmLabel: '삭제',
      destructive: true,
    })
    if (!confirmed) return
    const result = await run(deleteManual(manual.id), '삭제 실패')
    if (result.ok) {
      toast('삭제되었습니다')
      reload()
    } else if (result.message) {
      toast(result.message, 'error')
    }
  }

  return (
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
              {manuals.map((manual) => (
                <tr key={manual.id}>
                  <td className="col-lang">
                    <span className="lang-badge">{MANUAL_LANGUAGE_LABEL[manual.language]}</span>
                  </td>
                  <td className="col-title" title={manual.title}>{manual.title}</td>
                  <td className="col-actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => setModal({ mode: 'edit', id: manual.id })}
                    >
                      편집
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDelete(manual)}
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
          key={modal.mode === 'edit' ? modal.id : 'new'}
          manualId={modal.mode === 'edit' ? modal.id : null}
          onClose={() => setModal({ mode: 'closed' })}
          onSaved={() => {
            const wasEdit = modal.mode === 'edit'
            setModal({ mode: 'closed' })
            toast(wasEdit ? '수정되었습니다' : '등록되었습니다')
            reload()
          }}
        />
      )}
    </div>
  )
}
