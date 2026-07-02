import { useCallback } from 'react';
import api from '../lib/axiosInstance.ts';
import { useSMSStore } from '../store';
import { useRequest } from '../hooks/useRequest.ts';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus.ts';

export function useFetchSMS() {
  const setSms = useSMSStore(state => state.setSMS);
  const { request } = useRequest();

  const fetchSMS = useCallback(() => {
    request(
      () => api.get('/api/disaster-messages/latest').then(res => res.data.data),
      setSms,
      {
        ignoreErrorRedirect: true,
      },
    );
  }, [request, setSms]);

  useRefreshOnFocus(fetchSMS);
}
