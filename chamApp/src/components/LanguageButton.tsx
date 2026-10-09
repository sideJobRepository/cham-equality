import { useState } from 'react';
import { Modal } from 'react-native';
import styled from 'styled-components/native';
import { Check, Globe, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconButton from './ui/IconButton.tsx';
import { LANGUAGE_OPTIONS } from '../utils/language.ts';
import {
  colors,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  size,
  spacing,
} from '../theme/index.ts';

// 홈 상단에 언어 칩 5개를 나란히 두면 360dp 에서 넘치고 칩이 44보다 작았다.
// 버튼 하나로 줄이되, 언어를 모르는 사람도 알아보게 지구본과 현재 언어의 원어명을 같이 보인다.
export default function LanguageButton() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const current =
    LANGUAGE_OPTIONS.find(item => item.code === i18n.language) ??
    LANGUAGE_OPTIONS[0];

  const select = (code: string) => {
    setVisible(false);
    if (code !== i18n.language) i18n.changeLanguage(code);
  };

  return (
    <>
      <Trigger
        accessibilityRole="button"
        accessibilityLabel={`${t('common.changeLanguage')}, ${current.label}`}
        onPress={() => setVisible(true)}
      >
        <Globe color={colors.textSecondary} size={18} strokeWidth={2.2} />
        <TriggerText numberOfLines={1}>{current.label}</TriggerText>
      </Trigger>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <Overlay
          accessible={false}
          importantForAccessibility="no"
          onPress={() => setVisible(false)}
        >
          {/* 시트 안을 눌러도 바깥(닫기)으로 전달되지 않게 Pressable 로 감싼다.
              Pressable 은 기본으로 자식을 한 덩어리로 읽히게 해서 accessible 을 끈다 */}
          <Sheet
            accessible={false}
            accessibilityViewIsModal
            $bottom={insets.bottom}
            onPress={() => {}}
          >
            <SheetHeader>
              <SheetTitle accessibilityRole="header">
                {t('common.changeLanguage')}
              </SheetTitle>
              <IconButton
                accessibilityLabel={t('common.close')}
                onPress={() => setVisible(false)}
              >
                <X color={colors.textSecondary} size={22} />
              </IconButton>
            </SheetHeader>
            {LANGUAGE_OPTIONS.map(item => {
              const selected = item.code === current.code;
              return (
                <Option
                  key={item.code}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, checked: selected }}
                  accessibilityLanguage={item.locale}
                  accessibilityLabel={item.label}
                  $selected={selected}
                  onPress={() => select(item.code)}
                >
                  <OptionText $selected={selected}>{item.label}</OptionText>
                  {selected ? (
                    <Check color={colors.brand} size={20} strokeWidth={2.6} />
                  ) : null}
                </Option>
              );
            })}
          </Sheet>
        </Overlay>
      </Modal>
    </>
  );
}

const Trigger = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
  min-height: ${size.touchMin}px;
  padding: 0 ${spacing.lg}px;
  border-radius: ${radius.full}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

const TriggerText = styled.Text`
  color: ${colors.textSecondary};
  font-size: ${fontSize.label}px;
  font-weight: ${fontWeight.bold};
`;

const Overlay = styled.Pressable`
  flex: 1;
  justify-content: flex-end;
  background-color: ${colors.overlay};
`;

const Sheet = styled.Pressable<{ $bottom: number }>`
  padding: ${spacing.md}px ${spacing.xl}px ${({ $bottom }) =>
      $bottom + spacing.xl}px;
  border-top-left-radius: ${radius.lg}px;
  border-top-right-radius: ${radius.lg}px;
  background-color: ${colors.surface};
`;

const SheetHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing.xs}px;
`;

const SheetTitle = styled.Text`
  color: ${colors.text};
  font-size: ${fontSize.title}px;
  line-height: ${lineHeight.title}px;
  font-weight: ${fontWeight.heavy};
`;

const Option = styled.Pressable<{ $selected: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: ${size.buttonLg}px;
  margin-top: ${spacing.xs}px;
  padding: 0 ${spacing.lg}px;
  border-radius: ${radius.sm}px;
  background-color: ${({ $selected }) =>
    $selected ? colors.primarySoft : 'transparent'};
`;

const OptionText = styled.Text<{ $selected: boolean }>`
  color: ${({ $selected }) => ($selected ? colors.brand : colors.text)};
  font-size: ${fontSize.bodyLg}px;
  line-height: ${lineHeight.bodyLg}px;
  font-weight: ${({ $selected }) =>
    $selected ? fontWeight.heavy : fontWeight.medium};
`;
