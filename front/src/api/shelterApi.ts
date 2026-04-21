import type { ApiResponse, PageResponse, Shelter } from '../types/shelter'

export async function fetchShelters(page: number, size: number): Promise<PageResponse<Shelter>> {
  const res = await fetch(`/api/shelters?page=${page}&size=${size}`)
  if (!res.ok) {
    throw new Error(`대피소 목록 조회 실패 (HTTP ${res.status})`)
  }
  const json: ApiResponse<PageResponse<Shelter>> = await res.json()
  return json.data
}
