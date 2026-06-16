import { useCallback } from 'react';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus.ts';
import { useRequest } from '../hooks/useRequest.ts';
import api from '../lib/axiosInstance.ts';
import { useMapStore } from '../store/map.ts';

interface UseFetchMapOptions {
  refreshOnFocus?: boolean;
}

export function useFetchMap(options?: UseFetchMapOptions) {
  const { request } = useRequest();
  const setMap = useMapStore(state => state.setMap);

  const fetchMap = useCallback(() => {
    request(
      () => api.post(`/api/shelters/map`, {}).then(res => res.data.data),
      setMap,
      {
        ignoreErrorRedirect: true,
      },
    );
  }, [request, setMap]);

  useRefreshOnFocus(fetchMap, options?.refreshOnFocus ?? false);

  return fetchMap;
}
