import {
  fetchAppReports,
  fetchFeedbacks,
  fetchReports,
  type AdminAppReportFilter,
  type AdminReportFilter,
  type AppFeedbackStatus,
} from '@/api/adminApi'
import { buildFilteredListPath } from '@/hooks/useListQuery'

// "처리를 기다리는 건"을 뜻하는 필터 값. 목록 화면의 기본 필터와 대시보드·사이드바 배지가 같은 값을 쓰도록 한곳에 둔다.
export const REPORT_PENDING_FILTER: AdminReportFilter = 'PENDING'
export const APP_REPORT_PENDING_FILTER: AdminAppReportFilter = 'PENDING'
export const FEEDBACK_NEW_FILTER: AppFeedbackStatus = 'RECEIVED'

export type PendingCountKey = 'webReports' | 'appReports' | 'feedbacks'

export type PendingCountSource = {
  key: PendingCountKey
  /** 대시보드 카드 제목 */
  label: string
  description: string
  /** 카드를 눌렀을 때 여는 목록(필터가 걸린 URL) */
  listPath: string
  /** 목록 API에 size=1로 물어 totalElements만 쓴다(건수 전용 API가 따로 없다). */
  fetchTotal: () => Promise<number>
}

export const PENDING_COUNT_SOURCES: readonly PendingCountSource[] = [
  {
    key: 'webReports',
    label: '웹 제보 대기',
    description: '승인·반려를 기다리는 웹 제보',
    listPath: buildFilteredListPath('/admin/reports', REPORT_PENDING_FILTER),
    fetchTotal: async () => (await fetchReports(REPORT_PENDING_FILTER, 0, 1)).totalElements,
  },
  {
    key: 'appReports',
    label: '앱 제보 대기',
    description: '승인·반려를 기다리는 앱 제보',
    listPath: buildFilteredListPath('/admin/app-reports', APP_REPORT_PENDING_FILTER),
    fetchTotal: async () => (await fetchAppReports(APP_REPORT_PENDING_FILTER, 0, 1)).totalElements,
  },
  {
    key: 'feedbacks',
    label: '새 피드백',
    description: '아직 확인하지 않은(접수 상태) 앱 피드백',
    listPath: buildFilteredListPath('/admin/feedbacks', FEEDBACK_NEW_FILTER),
    fetchTotal: async () => (await fetchFeedbacks(FEEDBACK_NEW_FILTER, 0, 1)).totalElements,
  },
]
