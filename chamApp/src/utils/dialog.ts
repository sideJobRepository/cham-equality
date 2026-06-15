import { useCallback } from 'react';
import { Alert } from 'react-native';

export const useDialogUtil = () => {
  const alert = useCallback((title: string, description?: string) => {
    Alert.alert(title, description);
  }, []);

  const confirm = useCallback(
    async (title: string, description?: string) =>
      new Promise<boolean>((resolve) => {
        Alert.alert(title, description, [
          {
            text: '취소',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: '확인',
            onPress: () => resolve(true),
          },
        ]);
      }),
    [],
  );

  return { alert, confirm };
};
