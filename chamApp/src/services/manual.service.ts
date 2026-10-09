import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus.ts';
import { useRequest } from '../hooks/useRequest.ts';
import api from '../lib/axiosInstance.ts';
import { useManualStore } from '../store/manual.ts';

export type ManualListStatus = 'loading' | 'ready' | 'error';

export function useFetchManuals(query?: string) {
  const { request } = useRequest();
  const { i18n } = useTranslation();
  const setManuals = useManualStore(state => state.setManuals);
  // 실패를 '등록된 행동요령 없음'과 구분하려고 화면 전용 상태로 둔다(스토어는 목록만 보관).
  const [status, setStatus] = useState<ManualListStatus>('loading');
  // 검색어를 연달아 바꾸면 늦게 온 옛 응답이 상태를 덮어쓰므로 마지막 요청만 반영한다.
  const requestSeqRef = useRef(0);

  const fetchManuals = useCallback(() => {
    const seq = ++requestSeqRef.current;
    const trimmedQuery = query?.trim();
    setStatus('loading');
    request(
      () =>
        api
          .get(trimmedQuery ? '/api/manuals/search' : '/api/manuals', {
            params: trimmedQuery
              ? { lang: i18n.language, query: trimmedQuery }
              : { lang: i18n.language },
          })
          .then(res => res.data.data),
      data => {
        if (seq !== requestSeqRef.current) return;
        setManuals(data);
        setStatus('ready');
      },
      {
        ignoreErrorRedirect: true,
        // 목록 자리에 오류와 다시 시도를 직접 보여주므로 공통 알림은 끈다.
        disableAlert: true,
        // 목록 자리에 스피너를 직접 그리므로 공통 로딩 오버레이와 겹치지 않게 끈다.
        disableLoading: true,
      },
    ).catch(() => {
      if (seq === requestSeqRef.current) setStatus('error');
    });
  }, [i18n.language, query, request, setManuals]);

  useRefreshOnFocus(fetchManuals);

  return { fetchManuals, status };
}

export function useFetchManualDetail() {
  const { request } = useRequest();
  const setManualDetail = useManualStore(state => state.setManualDetail);

  const fetchManualDetail = useCallback(
    (id: number) =>
      request(
        () => api.get(`/api/manuals/${id}`).then(res => res.data.data),
        setManualDetail,
        {
          ignoreErrorRedirect: true,
        },
      ),
    [request, setManualDetail],
  );

  return fetchManualDetail;
}
