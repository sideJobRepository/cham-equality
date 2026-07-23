import type { ApiResponse } from '@/types/shelter'
import { http } from './http'

/** 행정구역 옵션. depth 0=시/도, 1=시/군/구, 2=읍/면/동 순으로 계층을 이룬다. */
export type RegionOption = {
  regionId: number
  parentId: number | null
  depth: number
  name: string
}

/**
 * 특정 depth의 행정구역 목록을 조회한다.
 * parentId를 주면 그 상위 구역에 속한 하위 구역만 반환된다(카스케이드 선택용).
 */
export async function fetchRegions(depth: number, parentId?: number): Promise<RegionOption[]> {
  const params: Record<string, number> = { depth }
  if (parentId != null) params.parentId = parentId
  const { data } = await http.get<ApiResponse<RegionOption[]>>('/regions', { params })
  return data.data
}
