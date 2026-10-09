'use client';

import { useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { useLoadingStore } from '../store/loading';
import { useDialogUtil } from '../utils/dialog';
import i18n from '../i18n';

interface RequestOptions {
  ignoreErrorRedirect?: boolean;
  disableLoading?: boolean;
  // 화면에서 오류를 직접 보여주는 호출은 공통 알림을 끈다(같은 오류가 두 번 뜨지 않게).
  disableAlert?: boolean;
}

export function useRequest() {
  const { alert } = useDialogUtil();
  const setLoading = useLoadingStore(state => state.setLoading);

  const request = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      onSuccess?: (data: T) => void,
      options?: RequestOptions,
    ): Promise<T | undefined> => {
      if (!options?.disableLoading) {
        setLoading(true);
      }
      try {
        const data = await requestFn();
        onSuccess?.(data);
        return data;
      } catch (error) {
        // 더 새로운 요청이 이 요청을 취소한 경우다. 오류가 아니므로 알리지 않는다.
        if (axios.isCancel(error)) return undefined;

        const err = error as AxiosError<any>;

        if (options?.ignoreErrorRedirect && !options?.disableAlert) {
          const errData = err.response?.data;

          //벨리데이터 형식 에러 검증
          if (
            Array.isArray(errData?.validation) &&
            errData.validation.length > 0
          ) {
            const messages = errData.validation
              .map((validationError: any) =>
                Object.values(validationError).join('\n'),
              )
              .join('\n');
            alert(messages, undefined, { tone: 'error' });
          } else {
            alert(
              err.response?.data?.message ?? i18n.t('common.error'),
              undefined,
              {
                tone: 'error',
              },
            );
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
