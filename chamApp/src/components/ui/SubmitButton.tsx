import { Send } from 'lucide-react-native';
import Button from './Button.tsx';

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
      label={label}
      onPress={onPress}
      icon={Send}
      disabled={disabled}
      loading={loading}
      fullWidth
    />
  );
}
