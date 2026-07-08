import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/axiosInstance.ts';
import { useSMSStore } from '../store';
import { useRequest } from '../hooks/useRequest.ts';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus.ts';

export function useFetchSMS() {
  const setSms = useSMSStore(state => state.setSMS);
  const { request } = useRequest();
  const { i18n } = useTranslation();

  const fetchSMS = useCallback(() => {
    request(
      () =>
        api
          .get('/api/disaster-messages/latest', {
            params: { lang: i18n.language },
          })
          .then(res => res.data.data),
      setSms,
      {
        ignoreErrorRedirect: true,
      },
    );
  }, [i18n.language, request, setSms]);

  useRefreshOnFocus(fetchSMS);
}
