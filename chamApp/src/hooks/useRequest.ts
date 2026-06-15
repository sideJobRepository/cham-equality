'use client';

import { useCallback } from 'react';
import { AxiosError } from 'axios';
import { useLoadingStore } from '../store/loading';
import { useDialogUtil } from '../utils/dialog';

interface RequestOptions {
  ignoreErrorRedirect?: boolean;
  disableLoading?: boolean;
}

export function useRequest() {
  const { alert } = useDialogUtil();
  const setLoading = useLoadingStore((state) => state.setLoading);

  const request = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      onSuccess?: (data: T) => void,
      options?: RequestOptions
    ): Promise<T | undefined> => {
      if (!options?.disableLoading) {
        setLoading(true);
      }
      try {
        const data = await requestFn();
        onSuccess?.(data);
        return data;
      } catch (error) {
        const err = error as AxiosError<any>;

        if (options?.ignoreErrorRedirect) {
          const errData = err.response?.data;

          //벨리데이터 형식 에러 검증
          if (Array.isArray(errData?.validation) && errData.validation.length > 0) {
            const messages = errData.validation
              .map((v: any) => Object.values(v).join('\n'))
              .join('\n');
            alert(messages);
          } else {
            alert(err.response?.data?.message ?? '오류가 발생했습니다.');
          }
        }
        throw error;
      } finally {
        if (!options?.disableLoading) {
          setLoading(false);
        }
      }
    },
    [alert, setLoading],
  );

  return { request };
}
