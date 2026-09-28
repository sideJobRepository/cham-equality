import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus.ts';
import { useRequest } from '../hooks/useRequest.ts';
import api from '../lib/axiosInstance.ts';
import { useManualStore } from '../store/manual.ts';

export function useFetchManuals(query?: string) {
  const { request } = useRequest();
  const { i18n } = useTranslation();
  const setManuals = useManualStore(state => state.setManuals);

  const fetchManuals = useCallback(() => {
    const trimmedQuery = query?.trim();
    request(
      () =>
        api
          .get(trimmedQuery ? '/api/manuals/search' : '/api/manuals', {
            params: trimmedQuery
              ? { lang: i18n.language, query: trimmedQuery }
              : { lang: i18n.language },
          })
          .then(res => res.data.data),
      setManuals,
      {
        ignoreErrorRedirect: true,
      },
    );
  }, [i18n.language, query, request, setManuals]);

  useRefreshOnFocus(fetchManuals);

  return fetchManuals;
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
