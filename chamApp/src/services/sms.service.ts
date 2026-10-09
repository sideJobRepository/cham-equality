import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/axiosInstance.ts';
import { useSMSStore } from '../store';
import { useRequest } from '../hooks/useRequest.ts';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus.ts';

/** 화면 포커스와 무관하게 최신 재난문자를 다시 받는다(푸시 수신·알림 탭 직후). */
export async function refreshSMS(language: string) {
  const res = await api.get('/api/disaster-messages/latest', {
    params: { lang: language },
  });
  useSMSStore.getState().setSMS(res.data.data);
}

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
