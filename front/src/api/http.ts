import axios, { AxiosError } from 'axios'

export const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

const ADMIN_PW_KEY = 'admin-password'

export function getAdminPassword(): string | null {
  return sessionStorage.getItem(ADMIN_PW_KEY)
}

export function setAdminPassword(pw: string): void {
  sessionStorage.setItem(ADMIN_PW_KEY, pw)
}

export function clearAdminPassword(): void {
  sessionStorage.removeItem(ADMIN_PW_KEY)
}

export class UnauthorizedError extends Error {
  constructor() {
    super('관리자 인증이 필요합니다')
    this.name = 'UnauthorizedError'
  }
}

function isAdminPath(url: string | undefined): boolean {
  if (!url) return false
  return url.startsWith('/admin') || url.startsWith('/download-file')
}

let oneShotUserPassword: string | null = null

export function useNextUserPassword(pw: string): void {
  oneShotUserPassword = pw
}

http.interceptors.request.use((config) => {
  const adminPw = getAdminPassword()
  if (adminPw && isAdminPath(config.url)) {
    config.headers.set('X-Admin-Password', adminPw)
  }
  if (oneShotUserPassword) {
    config.headers.set('X-User-Password', oneShotUserPassword)
    oneShotUserPassword = null
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && isAdminPath(err.config?.url)) {
      return Promise.reject(new UnauthorizedError())
    }
    return Promise.reject(err)
  },
)

export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof UnauthorizedError) return err.message
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    return status ? `${fallback} (HTTP ${status})` : fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}
