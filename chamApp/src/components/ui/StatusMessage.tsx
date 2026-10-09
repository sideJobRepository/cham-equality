import { ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import type { LucideIcon } from 'lucide-react-native';
import Button from './Button.tsx';
import {
  colors,
  fontSize,
  fontWeight,
  lineHeight,
  spacing,
} from '../../theme/index.ts';

export type StatusTone = 'neutral' | 'error';

interface StatusMessageProps {
  message: string;
  /** 불러오는 중이면 아이콘 대신 스피너를 보여준다 */
  loading?: boolean;
  icon?: LucideIcon;
  tone?: StatusTone;
  actionLabel?: string;
  onAction?: () => void;
  /** 카드 안처럼 좁은 곳에서는 위아래 여백을 줄인다 */
  compact?: boolean;
}

/**
 * 로딩·빈 목록·오류를 한 모양으로 보여준다.
 * 상태 문구는 화면이 바뀌어도 포커스가 옮겨가지 않아 TalkBack 이 알아채지 못하므로
 * Android 에선 liveRegion 으로 읽힌다.
 */
export default function StatusMessage({
  message,
  loading,
  icon: Icon,
  tone = 'neutral',
  actionLabel,
  onAction,
  compact,
}: StatusMessageProps) {
  const iconColor = tone === 'error' ? colors.danger : colors.textMuted;

  return (
    <Container $compact={!!compact}>
      <Body
        accessible
        accessibilityRole={tone === 'error' ? 'alert' : 'text'}
        accessibilityLabel={message}
        accessibilityState={{ busy: !!loading }}
        accessibilityLiveRegion="polite"
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : Icon ? (
          <Icon color={iconColor} size={24} strokeWidth={2.2} />
        ) : null}
        <Message>{message}</Message>
      </Body>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="soft"
          size="sm"
        />
      ) : null}
    </Container>
  );
}

const Container = styled.View<{ $compact: boolean }>`
  align-items: center;
  justify-content: center;
  gap: ${spacing.lg}px;
  padding: ${({ $compact }) =>
      $compact ? `${spacing.xl}px` : `${spacing.xxxl}px`}
    ${spacing.xl}px;
`;

const Body = styled.View`
  align-items: center;
  gap: ${spacing.md}px;
`;

const Message = styled.Text`
  color: ${colors.textMuted};
  font-size: ${fontSize.body}px;
  line-height: ${lineHeight.body}px;
  font-weight: ${fontWeight.medium};
  text-align: center;
`;
