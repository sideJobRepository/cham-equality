import type { ApiResponse } from '@/types/shelter'
import type {
  Manual,
  ManualLanguage,
  ManualListItem,
  ManualUpsertRequest,
} from '@/types/manual'
import { http } from './http'

// 목록 응답 — 본문(content) 없음. 언어는 소문자 코드(ko/en/zh/ja/vi).
type ServerManualListItem = {
  id: number
  language: string
  title: string
  createDate: string
  modifyDate: string
}

// 상세 응답 — 본문 필드명은 content.
type ServerManual = ServerManualListItem & {
  content: string
}

// UI는 대문자 언어(KO…)를 쓰고 서버는 소문자 코드를 쓴다. 코드 = 이름.toLowerCase() 이라 케이스만 변환하면 왕복된다.
function toUiLanguage(code: string): ManualLanguage {
  return code.toUpperCase() as ManualLanguage
}

function listItemFromServer(s: ServerManualListItem): ManualListItem {
  return {
    id: s.id,
    language: toUiLanguage(s.language),
    title: s.title,
  }
}

function detailFromServer(s: ServerManual): Manual {
  return {
    id: s.id,
    language: toUiLanguage(s.language),
    title: s.title,
    contentHtml: s.content,
  }
}

function toServerBody(body: ManualUpsertRequest) {
  return {
    language: body.language.toLowerCase(),
    title: body.title,
    content: body.contentHtml,
  }
}

export async function fetchManuals(): Promise<ManualListItem[]> {
  const { data } = await http.get<ApiResponse<ServerManualListItem[]>>('/admin/manuals')
  return data.data.map(listItemFromServer)
}

// 본문은 상세 조회에서만 내려온다. 관리자용 상세 엔드포인트가 없어 공개 API를 사용한다.
export async function fetchManualDetail(id: number): Promise<Manual> {
  const { data } = await http.get<ApiResponse<ServerManual>>(`/manuals/${id}`)
  return detailFromServer(data.data)
}

export async function createManual(body: ManualUpsertRequest): Promise<number> {
  const { data } = await http.post<ApiResponse<number>>('/admin/manuals', toServerBody(body))
  return data.data
}

export async function updateManual(id: number, body: ManualUpsertRequest): Promise<void> {
  await http.put(`/admin/manuals/${id}`, toServerBody(body))
}

export async function deleteManual(id: number): Promise<void> {
  await http.delete(`/admin/manuals/${id}`)
}
