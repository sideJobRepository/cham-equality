import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export function useRefreshOnFocus(callback: () => void, enabled = true) {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      callback();
    }, [callback, enabled]),
  );
}
