// 로그인 페이지로 보낼 때 "원래 보던 화면"을 next 쿼리로 넘기고, 로그인 뒤 그 경로로 돌려보낸다.
// next는 URL로 누구나 조작할 수 있으므로 관리자 화면 내부 경로만 받아들인다(오픈 리다이렉트 방지).

export const ADMIN_HOME_PATH = '/admin/reports'
const ADMIN_LOGIN_PATH = '/admin/login'

// 실제로 쓰이지 않는 가상 origin. 상대 경로를 URL 파서로 정규화하는 용도로만 쓴다.
const PARSE_ORIGIN = 'https://admin.invalid'

type LocationLike = { pathname: string; search: string; hash: string }

/** 현재 위치를 next로 붙인 로그인 경로. 로그인 화면 자체는 next로 넘기지 않는다. */
export function buildLoginPath(location: LocationLike): string {
  const current = `${location.pathname}${location.search}${location.hash}`
  const safeNext = safeAdminNext(current)
  return safeNext ? `${ADMIN_LOGIN_PATH}?next=${encodeURIComponent(safeNext)}` : ADMIN_LOGIN_PATH
}

/**
 * next 값이 `/admin` 아래 내부 경로면 정규화한 경로를, 아니면 null을 돌려준다.
 * `//evil.com`, `https://evil.com`, `/admin/..//evil.com`, 역슬래시가 섞인 값 등은 전부 거부한다.
 */
export function safeAdminNext(rawNext: string | null | undefined): string | null {
  if (!rawNext) return null
  // 파서 정규화 전에 명백히 이상한 값은 먼저 거른다. 역슬래시는 브라우저가 슬래시로 바꿔 읽는다.
  if (!rawNext.startsWith('/') || rawNext.startsWith('//') || rawNext.includes('\\')) return null

  let parsed: URL
  try {
    parsed = new URL(rawNext, PARSE_ORIGIN)
  } catch {
    return null
  }
  if (parsed.origin !== PARSE_ORIGIN) return null

  const { pathname } = parsed
  // `/admin`, `/admin/...`만 허용한다(`/adminfoo` 같은 값은 거부).
  if (pathname !== '/admin' && !pathname.startsWith('/admin/')) return null
  // `..`이 정규화되며 `//`로 시작하는 경로가 될 수 있으니 한 번 더 막는다.
  if (pathname.startsWith('//')) return null
  // 로그인 화면으로 돌아가면 로그인 직후 다시 로그인 화면이 떠서 막힌 것처럼 보인다.
  if (pathname === ADMIN_LOGIN_PATH || pathname.startsWith(`${ADMIN_LOGIN_PATH}/`)) return null

  return `${pathname}${parsed.search}${parsed.hash}`
}
