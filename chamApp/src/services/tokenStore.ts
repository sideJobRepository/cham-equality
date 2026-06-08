let accessToken: string | null = null;

export const tokenStore = {
  get(): string | null {
    return accessToken;
  },
  set(token: string | null) {
    accessToken = token;
  },
  clear() {
    accessToken = null;
  },
};
