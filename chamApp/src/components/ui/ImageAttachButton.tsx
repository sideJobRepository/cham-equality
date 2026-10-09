import styled from 'styled-components/native';
import { ImagePlus } from 'lucide-react-native';
import { colors } from '../../theme/index.ts';

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
      <ImagePlus color={colors.primary} size={16} strokeWidth={2.6} />
      <AttachButtonText>{label}</AttachButtonText>
    </AttachButton>
  );
}

const AttachButton = styled.Pressable`
  min-height: 40px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 6px;
  background-color: ${colors.primarySoft};
  border-width: 1px;
  border-color: ${colors.primaryBorder};
`;

const AttachButtonText = styled.Text`
  color: ${colors.primary};
  font-size: 13px;
  font-weight: 800;
`;
