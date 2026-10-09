import { useState, type ReactNode } from 'react';
import type {
  AccessibilityRole,
  GestureResponderEvent,
  Insets,
  StyleProp,
  ViewStyle,
} from 'react-native';
import styled from 'styled-components/native';
import { radius, size as sizeToken } from '../../theme/index.ts';

interface IconButtonProps {
  /** 아이콘만 있어 스크린리더가 읽을 글자가 없으므로 필수로 받는다 */
  accessibilityLabel: string;
  onPress: (event: GestureResponderEvent) => void;
  children: ReactNode;
  /**
   * 보이는 크기. 사진 위 화살표처럼 44로 키우면 내용을 가리는 곳만 줄이고,
   * 모자란 만큼은 hitSlop 으로 채워 실제 터치 영역은 44를 유지한다.
   */
  visualSize?: number;
  backgroundColor?: string;
  borderColor?: string;
  /** 기본은 원형. 사각 버튼은 모서리 반경을 넘긴다 */
  borderRadius?: number;
  disabled?: boolean;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  style?: StyleProp<ViewStyle>;
}

export default function IconButton({
  accessibilityLabel,
  onPress,
  children,
  visualSize = sizeToken.touchMin,
  backgroundColor = 'transparent',
  borderColor,
  borderRadius = radius.full,
  disabled,
  accessibilityHint,
  accessibilityRole = 'button',
  style,
}: IconButtonProps) {
  const [pressed, setPressed] = useState(false);
  const slop = Math.max(0, (sizeToken.touchMin - visualSize) / 2);
  const hitSlop: Insets | undefined = slop
    ? { top: slop, bottom: slop, left: slop, right: slop }
    : undefined;

  return (
    <Container
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={style}
      $size={visualSize}
      $background={backgroundColor}
      $border={borderColor}
      $radius={borderRadius}
      $pressed={pressed}
    >
      {children}
    </Container>
  );
}

const Container = styled.Pressable<{
  $size: number;
  $background: string;
  $border?: string;
  $radius: number;
  $pressed: boolean;
}>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  align-items: center;
  justify-content: center;
  border-radius: ${({ $radius }) => $radius}px;
  background-color: ${({ $background }) => $background};
  ${({ $border }) => ($border ? `border-width: 1px; border-color: ${$border};` : '')}
  opacity: ${({ $pressed }) => ($pressed ? 0.6 : 1)};
`;
