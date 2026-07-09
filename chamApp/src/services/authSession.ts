import { tokenStore } from './tokenStore';
import { saveRefreshToken, clearRefreshToken } from './refreshTokenStore';
import { useUserStore, type User } from '../store/user';

// 백엔드 로그인/재발급 응답(raw TokenResponse). 앱 로그인·refresh 헤더 요청에는 refreshToken이 함께 온다.
export interface MemberDto {
  id: number;
  name: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: MemberDto;
}

function mapUser(dto: MemberDto): User {
  // 백엔드 MemberResponseDto엔 email이 없어 빈값으로 둔다.
  return { id: String(dto.id), email: '', name: dto.name, roles: dto.roles ?? [] };
}

// 로그인/재발급 성공 시 access(메모리) + refresh(keychain) + user(zustand)를 한번에 반영.
export async function applySession(data: AuthResponse): Promise<void> {
  tokenStore.set(data.token);
  if (data.refreshToken) {
    await saveRefreshToken(data.refreshToken);
  }
  useUserStore.getState().setUser(mapUser(data.user));
}

export async function clearSession(): Promise<void> {
  tokenStore.clear();
  await clearRefreshToken();
  useUserStore.getState().clearUser();
}
