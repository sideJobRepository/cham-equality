import { useCallback } from 'react';
import api from '../lib/axiosInstance.ts';
import { useDisasterStore } from '../store';
import { useRequest } from '../hooks/useRequest.ts';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus.ts';

export function useFetchDisaster() {
  const setDisaster = useDisasterStore(state => state.setDisaster);
  const { request } = useRequest();

  const fetchDisaster = useCallback(() => {
    request(
      () => api.get('/api/daily-safety/latest').then(res => res.data.data),
      setDisaster,
      {
        ignoreErrorRedirect: true,
      },
    );
  }, [request, setDisaster]);

  useRefreshOnFocus(fetchDisaster);
}
