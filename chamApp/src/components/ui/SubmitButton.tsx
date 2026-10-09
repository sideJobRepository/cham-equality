import { ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { Send } from 'lucide-react-native';
import { colors } from '../../theme/index.ts';

interface SubmitButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function SubmitButton({
  label,
  onPress,
  disabled,
  loading,
}: SubmitButtonProps) {
  return (
    <Button
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: !!loading, disabled: !!(disabled || loading) }}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnColor} />
      ) : (
        <>
          <Send color={colors.textOnColor} size={16} strokeWidth={2.6} />
          <ButtonText>{label}</ButtonText>
        </>
      )}
    </Button>
  );
}

const Button = styled.Pressable`
  min-height: 46px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 7px;
  background-color: ${colors.primary};
`;

const ButtonText = styled.Text`
  color: ${colors.textOnColor};
  font-size: 14px;
  font-weight: 800;
`;
