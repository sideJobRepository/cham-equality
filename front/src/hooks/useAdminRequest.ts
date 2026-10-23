import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clearAdminPassword, errorMessage, UnauthorizedError } from '@/api/adminApi'
import { buildLoginPath } from '@/lib/adminRedirect'

/**
 * - ok: true  → 요청 성공, data에 결과.
 * - ok: false → 실패. message는 사용자에게 보여줄 한국어 문구(서버 message 우선).
 *   인증 만료(401)는 이미 로그인 화면으로 보냈으므로 message가 null이다 — 호출부는 그냥 멈추면 된다.
 */
export type AdminRequestResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string | null }

/**
 * 관리자 API 호출 공통 처리. 페이지·모달마다 반복하던
 * `UnauthorizedError면 비밀번호 지우고 로그인으로, 아니면 e.message` 분기를 한곳으로 모은다.
 */
export function useAdminRequest() {
  const navigate = useNavigate()
  const location = useLocation()
  // 콜백을 위치와 무관하게 고정해 두려고 최신 위치는 ref로 읽는다.
  // (모달의 로딩 effect가 onUnauthorized를 deps로 쓰는데, 위치가 바뀔 때마다 재요청되면 안 된다)
  const locationRef = useRef(location)
  useEffect(() => {
    locationRef.current = location
  }, [location])

  /** 비밀번호를 지우고, 보던 화면을 next로 붙여 로그인 화면으로 보낸다. */
  const handleUnauthorized = useCallback(() => {
    clearAdminPassword()
    navigate(buildLoginPath(locationRef.current), { replace: true })
  }, [navigate])

  const run = useCallback(
    async <T>(request: Promise<T>, fallbackMessage: string): Promise<AdminRequestResult<T>> => {
      try {
        return { ok: true, data: await request }
      } catch (requestError: unknown) {
        if (requestError instanceof UnauthorizedError) {
          handleUnauthorized()
          return { ok: false, message: null }
        }
        return { ok: false, message: errorMessage(requestError, fallbackMessage) }
      }
    },
    [handleUnauthorized],
  )

  return { run, handleUnauthorized }
}
