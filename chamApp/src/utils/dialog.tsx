import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, Modal } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import styled from 'styled-components/native';
import i18n from '../i18n';

// 웹(cham-front/src/utils/toast.js + GlobalStyle 의 .cham-alert, SweetAlert2)과 같은 규칙·색을 쓴다.
// - 성공·안내는 [확인] 을 누르거나 3초 뒤 저절로 닫힌다
// - 실패·경고는 [확인] 을 눌러야 닫힌다
// - 창은 한 번에 하나라, 새 알림이 오면 앞 알림을 바꾼다
export type DialogTone = 'success' | 'error' | 'warning' | 'info';

const TONE_COLORS: Record<DialogTone, string> = {
  success: '#16a34a',
  error: '#e5484d',
  warning: '#f59e0b',
  info: '#093A6E',
};
const CONFIRM_COLOR = '#093A6E';
const CANCEL_COLOR = '#8a94a3';
const DESTRUCTIVE_COLOR = '#e5484d';
const AUTO_CLOSE_MS = 3000;

type DialogAction = {
  label: string;
  variant: 'confirm' | 'cancel' | 'destructive';
  onPress: () => void;
};

type DialogState = {
  id: number;
  title: string;
  description?: string;
  tone?: DialogTone;
  actions: DialogAction[];
  // 저절로 닫힐 때 부를 함수(성공·안내 alert 만)
  autoClose?: () => void;
};

type AlertOptions = { tone?: DialogTone };
type ConfirmOptions = {
  tone?: DialogTone;
  confirmLabel?: string;
  /** 회원 탈퇴처럼 되돌릴 수 없는 동작이면 확인 버튼을 빨간색으로 */
  destructive?: boolean;
};

type DialogApi = {
  alert: (
    title: string,
    description?: string,
    options?: AlertOptions,
  ) => Promise<void>;
  confirm: (
    title: string,
    description?: string,
    options?: ConfirmOptions,
  ) => Promise<boolean>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: PropsWithChildren) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const idRef = useRef(0);

  const close = useCallback(() => {
    setDialog(null);
  }, []);

  const alert = useCallback(
    (title: string, description?: string, options?: AlertOptions) =>
      new Promise<void>(resolve => {
        const done = () => {
          close();
          resolve();
        };
        const tone = options?.tone;
        idRef.current += 1;
        setDialog({
          id: idRef.current,
          title,
          description,
          tone,
          actions: [
            {
              label: i18n.t('common.ok', { defaultValue: '확인' }),
              variant: 'confirm',
              onPress: done,
            },
          ],
          autoClose: tone === 'success' || tone === 'info' ? done : undefined,
        });
      }),
    [close],
  );

  const confirm = useCallback(
    (title: string, description?: string, options?: ConfirmOptions) =>
      new Promise<boolean>(resolve => {
        idRef.current += 1;
        setDialog({
          id: idRef.current,
          title,
          description,
          tone: options?.tone,
          actions: [
            {
              label: i18n.t('common.cancel', { defaultValue: '취소' }),
              variant: 'cancel',
              onPress: () => {
                close();
                resolve(false);
              },
            },
            {
              label:
                options?.confirmLabel ??
                i18n.t('common.ok', { defaultValue: '확인' }),
              variant: options?.destructive ? 'destructive' : 'confirm',
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

  // 성공·안내는 3초 뒤 저절로 닫는다. 새 알림으로 바뀌면 앞 타이머는 버린다.
  useEffect(() => {
    if (!dialog?.autoClose) return;
    const timer = setTimeout(dialog.autoClose, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [dialog]);

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal
        visible={dialog !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          // 안드로이드 뒤로가기는 취소(또는 확인 1개짜리면 확인)로 처리한다.
          dialog?.actions[0]?.onPress();
        }}
      >
        <DialogOverlay>
          {dialog ? <DialogCardView key={dialog.id} dialog={dialog} /> : null}
        </DialogOverlay>
      </Modal>
    </DialogContext.Provider>
  );
}

function DialogCardView({ dialog }: { dialog: DialogState }) {
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <DialogCard
      style={{ transform: [{ scale }] }}
      accessibilityViewIsModal
      accessibilityRole="alert"
    >
      {dialog.tone ? <ToneIcon tone={dialog.tone} /> : null}
      <DialogTitle>{dialog.title}</DialogTitle>
      {dialog.description ? (
        <DialogDescription>{dialog.description}</DialogDescription>
      ) : null}
      <ActionRow>
        {dialog.actions.map(action => (
          <ActionButton
            key={action.variant}
            $variant={action.variant}
            onPress={action.onPress}
            accessibilityRole="button"
          >
            <ActionText>{action.label}</ActionText>
          </ActionButton>
        ))}
      </ActionRow>
    </DialogCard>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const ICON_SIZE = 72;
const RING_RADIUS = 32;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

// 원 안 기호. length 는 dash 애니메이션용 대략 길이(실제보다 넉넉하게).
const TONE_SYMBOLS: Record<DialogTone, { d: string; length: number }[]> = {
  success: [{ d: 'M22 37 L32 47 L51 27', length: 48 }],
  error: [
    { d: 'M26 26 L46 46', length: 30 },
    { d: 'M46 26 L26 46', length: 30 },
  ],
  warning: [
    { d: 'M36 20 L36 40', length: 22 },
    { d: 'M36 49 L36 51', length: 4 },
  ],
  info: [
    { d: 'M36 21 L36 23', length: 4 },
    { d: 'M36 32 L36 52', length: 22 },
  ],
};

// SweetAlert 처럼 원 테두리가 먼저 그려지고 이어서 안쪽 기호가 그려진다.
function ToneIcon({ tone }: { tone: DialogTone }) {
  const progress = useRef(new Animated.Value(0)).current;
  const color = TONE_COLORS[tone];

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      // SVG 속성은 네이티브 드라이버로 못 움직인다.
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const ringOffset = progress.interpolate({
    inputRange: [0, 0.6],
    outputRange: [RING_LENGTH, 0],
    extrapolate: 'clamp',
  });

  return (
    <IconWrap>
      <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 72 72">
        <Circle
          cx={36}
          cy={36}
          r={RING_RADIUS}
          stroke={color}
          strokeOpacity={0.18}
          strokeWidth={4}
          fill="none"
        />
        <AnimatedCircle
          cx={36}
          cy={36}
          r={RING_RADIUS}
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${RING_LENGTH} ${RING_LENGTH}`}
          strokeDashoffset={ringOffset}
          rotation={-90}
          origin="36, 36"
        />
        {TONE_SYMBOLS[tone].map(symbol => (
          <AnimatedPath
            key={symbol.d}
            d={symbol.d}
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={`${symbol.length} ${symbol.length}`}
            strokeDashoffset={progress.interpolate({
              inputRange: [0.5, 1],
              outputRange: [symbol.length, 0],
              extrapolate: 'clamp',
            })}
          />
        ))}
      </Svg>
    </IconWrap>
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
  padding: 16px;
  background: rgba(15, 23, 42, 0.4);
`;

const DialogCard = styled(Animated.View)`
  width: 100%;
  max-width: 360px;
  align-items: center;
  border-radius: 16px;
  background: #ffffff;
  padding: 24px 20px 20px;
  shadow-color: #0f172a;
  shadow-opacity: 0.16;
  shadow-radius: 24px;
  shadow-offset: 0px 12px;
  elevation: 10;
`;

const IconWrap = styled.View`
  margin: 4px 0 14px;
`;

const DialogTitle = styled.Text`
  color: #1f2a37;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  text-align: center;
`;

const DialogDescription = styled.Text`
  margin-top: 6px;
  color: #6b7280;
  font-size: 14px;
  line-height: 21px;
  text-align: center;
`;

const ActionRow = styled.View`
  align-self: stretch;
  flex-direction: row;
  gap: 8px;
  margin-top: 18px;
`;

const ActionButton = styled.Pressable<{
  $variant: DialogAction['variant'];
}>`
  flex: 1;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: ${({ $variant }) =>
    $variant === 'destructive'
      ? DESTRUCTIVE_COLOR
      : $variant === 'cancel'
      ? CANCEL_COLOR
      : CONFIRM_COLOR};
`;

const ActionText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
`;
