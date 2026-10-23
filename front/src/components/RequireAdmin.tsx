import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getAdminPassword } from '@/api/adminApi'
import AdminLayout from '@/components/AdminLayout'
import FeedbackProvider from '@/components/common/Feedback'
import { buildLoginPath } from '@/lib/adminRedirect'

/**
 * `/admin/*` 화면 공통 관문. 비밀번호가 없으면 보던 경로를 next로 붙여 로그인으로 보내고,
 * 있으면 사이드바 레이아웃 + 토스트·확인창 Provider 안에 하위 라우트를 그린다.
 * 비밀번호가 틀렸거나 만료된 경우(서버 401)는 useAdminRequest가 처리한다.
 */
export default function RequireAdmin() {
  const location = useLocation()

  if (!getAdminPassword()) {
    return <Navigate to={buildLoginPath(location)} replace />
  }

  // Provider는 레이아웃 안쪽에 둔다. 토스트·확인창이 `.admin-layout`에 정의된 --ab-* 토큰을 물려받아야 한다.
  return (
    <AdminLayout>
      <FeedbackProvider>
        <Outlet />
      </FeedbackProvider>
    </AdminLayout>
  )
}
