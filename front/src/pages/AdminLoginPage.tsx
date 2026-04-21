import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin, setAdminPassword } from '../api/adminApi'
import './AdminLoginPage.css'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const ok = await adminLogin(password)
      if (!ok) {
        setError('비밀번호가 올바르지 않습니다')
        return
      }
      setAdminPassword(password)
      navigate('/admin/reports', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인 실패')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>관리자 로그인</h1>
        <p className="hint">승인 대기 중인 대피소 정보 제보를 검토합니다.</p>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit" disabled={submitting || !password}>
          {submitting ? '확인 중…' : '로그인'}
        </button>
      </form>
    </div>
  )
}
