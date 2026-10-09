import { useState } from 'react';
import {
  ActivityIndicator,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import styled from 'styled-components/native';
import type { LucideIcon } from 'lucide-react-native';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  size as sizeToken,
  spacing,
} from '../../theme/index.ts';

// 주요 동작(확인·제출·길찾기·재시도)은 남색 primary 하나로 맞춘다.
// 파랑(colors.primary)은 링크·선택 상태·토글 전용이라 여기 variant 로 두지 않는다.
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'soft'
  | 'outline'
  | 'ghost'
  | 'danger';
export type ButtonSize = 'md' | 'sm';

type VariantStyle = { background: string; border: string; text: string };

const VARIANT_STYLES: Record<ButtonVariant, VariantStyle> = {
  primary: {
    background: colors.brand,
    border: colors.brand,
    text: colors.textOnColor,
  },
  secondary: {
    background: colors.surfaceMuted,
    border: colors.surfaceMuted,
    text: colors.text,
  },
  soft: {
    background: colors.primarySoft,
    border: colors.primaryBorder,
    text: colors.brand,
  },
  outline: {
    background: colors.surface,
    border: colors.borderStrong,
    text: colors.text,
  },
  ghost: {
    background: 'transparent',
    border: 'transparent',
    text: colors.primary,
  },
  danger: {
    background: colors.danger,
    border: colors.danger,
    text: colors.textOnColor,
  },
};

const SIZE_HEIGHT: Record<ButtonSize, number> = {
  md: sizeToken.buttonLg,
  sm: sizeToken.touchMin,
};

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** 남은 가로 공간을 채울 때(가로로 나란한 버튼 중 주 버튼) */
  flex?: boolean;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** 외부 링크로 나가는 버튼은 'link' 로 읽히게 바꿀 수 있다 */
  accessibilityRole?: AccessibilityRole;
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth,
  flex,
  icon: Icon,
  disabled,
  loading,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  style,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const palette = VARIANT_STYLES[variant];
  const inactive = !!(disabled || loading);
  const iconSize = size === 'md' ? 18 : 16;

  return (
    <Container
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={style}
      $palette={palette}
      $height={SIZE_HEIGHT[size]}
      $fullWidth={!!fullWidth}
      $flex={!!flex}
      $pressed={pressed}
      $disabled={!!disabled}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {Icon ? (
            <Icon color={palette.text} size={iconSize} strokeWidth={2.6} />
          ) : null}
          <Label $color={palette.text} $size={size} numberOfLines={2}>
            {label}
          </Label>
        </>
      )}
    </Container>
  );
}

const Container = styled.Pressable<{
  $palette: VariantStyle;
  $height: number;
  $fullWidth: boolean;
  $flex: boolean;
  $pressed: boolean;
  $disabled: boolean;
}>`
  min-height: ${({ $height }) => $height}px;
  ${({ $fullWidth }) => ($fullWidth ? 'align-self: stretch;' : '')}
  ${({ $flex }) => ($flex ? 'flex: 1;' : '')}
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${spacing.sm}px;
  padding: ${spacing.mdPlus}px ${spacing.xl}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ $palette }) => $palette.border};
  background-color: ${({ $palette }) => $palette.background};
  opacity: ${({ $pressed, $disabled }) =>
    $disabled ? 0.5 : $pressed ? 0.82 : 1};
`;

const Label = styled.Text<{ $color: string; $size: ButtonSize }>`
  flex-shrink: 1;
  color: ${({ $color }) => $color};
  font-size: ${({ $size }) =>
    $size === 'md' ? fontSize.bodyLg : fontSize.body}px;
  font-weight: ${fontWeight.heavy};
  text-align: center;
`;
