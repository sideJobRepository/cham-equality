import styled from 'styled-components/native';
import { ImagePlus } from 'lucide-react-native';
import { colors, size } from '../../theme/index.ts';

interface ImageAttachButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function ImageAttachButton({
  label,
  onPress,
  disabled,
}: ImageAttachButtonProps) {
  return (
    <AttachButton
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
    >
      <ImagePlus color={colors.brand} size={16} strokeWidth={2.6} />
      <AttachButtonText>{label}</AttachButtonText>
    </AttachButton>
  );
}

// 버튼이라 주요 동작 색(남색)을 쓴다. 파랑은 링크·선택 상태 전용
const AttachButton = styled.Pressable`
  min-height: ${size.touchMin}px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 6px;
  background-color: ${colors.surface};
  border-width: 1px;
  border-color: ${colors.brand};
`;

const AttachButtonText = styled.Text`
  color: ${colors.brand};
  font-size: 13px;
  font-weight: 800;
`;
