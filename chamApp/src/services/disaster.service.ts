import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/axiosInstance.ts';
import { useDisasterStore } from '../store';
import { useRequest } from '../hooks/useRequest.ts';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus.ts';

export function useFetchDisaster() {
  const setDisaster = useDisasterStore(state => state.setDisaster);
  const { request } = useRequest();
  const { i18n } = useTranslation();

  const fetchDisaster = useCallback(() => {
    request(
      () =>
        api
          .get('/api/daily-safety/latest', {
            params: { lang: i18n.language },
          })
          .then(res => res.data.data),
      setDisaster,
      {
        ignoreErrorRedirect: true,
      },
    );
  }, [i18n.language, request, setDisaster]);

  useRefreshOnFocus(fetchDisaster);
}
