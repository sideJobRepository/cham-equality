import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Modal } from 'react-native';
import styled from 'styled-components/native';
import i18n from '../i18n';

type DialogAction = {
  label: string;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
};

type DialogState = {
  title: string;
  description?: string;
  actions: DialogAction[];
};

type DialogApi = {
  alert: (title: string, description?: string) => Promise<void>;
  confirm: (title: string, description?: string) => Promise<boolean>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: PropsWithChildren) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const close = useCallback(() => {
    setDialog(null);
  }, []);

  const alert = useCallback(
    (title: string, description?: string) =>
      new Promise<void>(resolve => {
        setDialog({
          title,
          description,
          actions: [
            {
              label: i18n.t('common.ok', { defaultValue: '확인' }),
              variant: 'primary',
              onPress: () => {
                close();
                resolve();
              },
            },
          ],
        });
      }),
    [close],
  );

  const confirm = useCallback(
    (title: string, description?: string) =>
      new Promise<boolean>(resolve => {
        setDialog({
          title,
          description,
          actions: [
            {
              label: i18n.t('common.cancel', { defaultValue: '취소' }),
              variant: 'secondary',
              onPress: () => {
                close();
                resolve(false);
              },
            },
            {
              label: i18n.t('common.ok', { defaultValue: '확인' }),
              variant: 'primary',
              onPress: () => {
                close();
                resolve(true);
              },
            },
          ],
        });
      }),
    [close],
  );

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal
        visible={dialog !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <DialogOverlay>
          <DialogCard>
            <DialogTitle>{dialog?.title}</DialogTitle>
            {dialog?.description ? (
              <DialogDescription>{dialog.description}</DialogDescription>
            ) : null}
            <ActionRow>
              {dialog?.actions.map(action => (
                <ActionButton
                  key={action.label}
                  $variant={action.variant ?? 'secondary'}
                  onPress={action.onPress}
                >
                  <ActionText $variant={action.variant ?? 'secondary'}>
                    {action.label}
                  </ActionText>
                </ActionButton>
              ))}
            </ActionRow>
          </DialogCard>
        </DialogOverlay>
      </Modal>
    </DialogContext.Provider>
  );
}

export const useDialogUtil = () => {
  const dialog = useContext(DialogContext);

  if (!dialog) {
    throw new Error('useDialogUtil must be used inside DialogProvider.');
  }

  return dialog;
};

const DialogOverlay = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 28px;
  background: rgba(17, 24, 39, 0.22);
`;

const DialogCard = styled.View`
  width: 100%;
  max-width: 352px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  padding: 22px 18px 16px;
  shadow-color: #0f172a;
  shadow-opacity: 0.12;
  shadow-radius: 18px;
  shadow-offset: 0px 10px;
  elevation: 8;
`;

const DialogTitle = styled.Text`
  color: #111827;
  font-size: 14px;
  font-weight: 600;
  line-height: 24px;
`;

const DialogDescription = styled.Text`
  margin-top: 8px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
`;

const ActionRow = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
`;

const ActionButton = styled.Pressable<{ $variant: 'primary' | 'secondary' }>`
  //min-width: 76px;
  //min-height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 4px 8px;
  background: ${({ $variant }) =>
    $variant === 'primary' ? '#2563eb' : '#ffffff'};
  border: 1px solid
    ${({ $variant }) => ($variant === 'primary' ? '#2563eb' : '#d1d5db')};
`;

const ActionText = styled.Text<{ $variant: 'primary' | 'secondary' }>`
  color: ${({ $variant }) => ($variant === 'primary' ? '#ffffff' : '#4b5563')};
  font-size: 14px;
  font-weight: 800;
`;
