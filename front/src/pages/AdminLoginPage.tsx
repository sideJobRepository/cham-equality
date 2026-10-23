import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adminLogin, errorMessage, setAdminPassword } from '@/api/adminApi'
import { ADMIN_HOME_PATH, safeAdminNext } from '@/lib/adminRedirect'
import './AdminLoginPage.css'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const ok = await adminLogin(password)
      if (!ok) {
        setError('비밀번호가 올바르지 않습니다')
        return
      }
      setAdminPassword(password)
      // 인증이 끊겨 넘어온 경우 보던 화면으로 돌려보낸다. 관리자 내부 경로가 아니면 기본 화면으로.
      navigate(safeAdminNext(searchParams.get('next')) ?? ADMIN_HOME_PATH, { replace: true })
    } catch (loginError: unknown) {
      setError(errorMessage(loginError, '로그인 실패'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>관리자 로그인</h1>
        <p className="hint">모두의 안전 관리자 페이지입니다.</p>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(changeEvent) => setPassword(changeEvent.target.value)}
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
