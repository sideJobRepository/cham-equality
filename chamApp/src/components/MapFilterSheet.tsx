import { useEffect, useState } from 'react';
import { Modal, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import Button from './ui/Button.tsx';
import IconButton from './ui/IconButton.tsx';
import {
  ACCESSIBILITY_ALL_LABEL,
  SHELTER_ALL_LABEL,
  accessibilityFilterLabelKeys,
  accessibilityOptions,
  shelterTypeFilterLabelKeys,
  shelterTypeOptions,
  toggleWithAll,
  useMapFilterStore,
} from '../store/mapFilters.ts';
import {
  colors,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  size,
  spacing,
} from '../theme/index.ts';

const accessibilityChoices = accessibilityOptions.filter(
  item => item !== ACCESSIBILITY_ALL_LABEL,
);

// 유형 이름이 길어서('지진겸용 임시주거시설') 고른 만큼 칩을 늘어놓으면 한 줄을 다 먹는다.
// 첫 번째 이름 + 나머지 개수로 한 칩에 접고, 스크린리더에는 전부 읽어 준다.
export function useShelterTypeSummary() {
  const { t: translate } = useTranslation();
  const selectedShelterTypes = useMapFilterStore(
    state => state.selectedShelterTypes,
  );
  const labels = selectedShelterTypes
    .filter(item => item !== SHELTER_ALL_LABEL)
    .map(item => translate(shelterTypeFilterLabelKeys[item] ?? item));

  return {
    count: labels.length,
    label: labels.length > 1 ? `${labels[0]} +${labels.length - 1}` : labels[0],
    fullLabel: labels.join(', '),
  };
}

interface MapFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 홈은 접근성 칩이 화면에 늘 나와 있어서 시트에선 유형만 고른다 */
  showAccessibility?: boolean;
}

// 지도 필터 버튼과 홈 유형 칩이 같은 시트를 연다. 선택은 같은 스토어라 두 화면이 맞물린다.
export default function MapFilterSheet({
  visible,
  onClose,
  showAccessibility = true,
}: MapFilterSheetProps) {
  const { t: translate } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const selectedShelterTypes = useMapFilterStore(
    state => state.selectedShelterTypes,
  );
  const selectedAccessibility = useMapFilterStore(
    state => state.selectedAccessibility,
  );
  const applyFilters = useMapFilterStore(state => state.applyFilters);

  // 시트에서 고르는 동안엔 지도를 다시 불러오지 않게 적용 전까지 따로 들고 있는다
  const [draftShelterTypes, setDraftShelterTypes] = useState<string[]>([]);
  const [draftAccessibility, setDraftAccessibility] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    setDraftShelterTypes(selectedShelterTypes);
    setDraftAccessibility(selectedAccessibility);
    // 열릴 때 한 번만 옮겨 담는다. 열려 있는 동안 스토어가 바뀌어도 고르던 걸 덮지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const resetDraft = () => {
    setDraftShelterTypes([SHELTER_ALL_LABEL]);
    if (showAccessibility) setDraftAccessibility([ACCESSIBILITY_ALL_LABEL]);
  };

  const apply = () => {
    applyFilters(draftShelterTypes, draftAccessibility);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Overlay
        accessible={false}
        importantForAccessibility="no"
        onPress={onClose}
      >
        {/* 시트 안을 눌러도 바깥(닫기)으로 전달되지 않게 Pressable 로 감싼다 */}
        <Sheet
          accessible={false}
          accessibilityViewIsModal
          $bottom={insets.bottom}
          $maxHeight={windowHeight * 0.8}
          onPress={() => {}}
        >
          <SheetHeader>
            <SheetTitle accessibilityRole="header">
              {translate(
                showAccessibility
                  ? 'map.filterSheet.title'
                  : 'map.filterSheet.shelterType',
              )}
            </SheetTitle>
            <IconButton
              accessibilityLabel={translate('common.close')}
              onPress={onClose}
            >
              <X color={colors.textSecondary} size={22} />
            </IconButton>
          </SheetHeader>

          <SheetBody>
            {showAccessibility ? (
              <SectionTitle accessibilityRole="header">
                {translate('map.filterSheet.shelterType')}
              </SectionTitle>
            ) : null}
            <ChipWrap>
              {shelterTypeOptions.map(item => {
                const selected = draftShelterTypes.includes(item);
                return (
                  <SheetChip
                    key={item}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    $selected={selected}
                    $selectedColor={colors.filterStrong.shelter}
                    onPress={() =>
                      setDraftShelterTypes(prev =>
                        toggleWithAll(prev, item, SHELTER_ALL_LABEL),
                      )
                    }
                  >
                    <SheetChipText $selected={selected}>
                      {translate(shelterTypeFilterLabelKeys[item] ?? item)}
                    </SheetChipText>
                  </SheetChip>
                );
              })}
            </ChipWrap>

            {showAccessibility ? (
              <>
                <SectionTitle accessibilityRole="header">
                  {translate('map.filterSheet.accessibility')}
                </SectionTitle>
                <SectionDescription>
                  {translate('map.accessibilityInfo.description')}
                </SectionDescription>
                <ChipWrap>
                  {accessibilityChoices.map(item => {
                    const selected = draftAccessibility.includes(item);
                    return (
                      <SheetChip
                        key={item}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        $selected={selected}
                        $selectedColor={colors.filterStrong.accessibility}
                        onPress={() =>
                          setDraftAccessibility(prev =>
                            toggleWithAll(prev, item, ACCESSIBILITY_ALL_LABEL),
                          )
                        }
                      >
                        <SheetChipText $selected={selected}>
                          {translate(
                            accessibilityFilterLabelKeys[item] ?? item,
                          )}
                        </SheetChipText>
                      </SheetChip>
                    );
                  })}
                </ChipWrap>
              </>
            ) : null}
          </SheetBody>

          <SheetFooter>
            <Button
              label={translate('map.filterSheet.reset')}
              variant="outline"
              onPress={resetDraft}
            />
            <Button
              label={translate('map.filterSheet.apply')}
              flex
              onPress={apply}
            />
          </SheetFooter>
        </Sheet>
      </Overlay>
    </Modal>
  );
}

const Overlay = styled.Pressable`
  flex: 1;
  justify-content: flex-end;
  background-color: ${colors.overlay};
`;

const Sheet = styled.Pressable<{ $bottom: number; $maxHeight: number }>`
  max-height: ${({ $maxHeight }) => $maxHeight}px;
  padding: ${spacing.md}px ${spacing.xl}px
    ${({ $bottom }) => $bottom + spacing.xl}px;
  border-top-left-radius: ${radius.lg}px;
  border-top-right-radius: ${radius.lg}px;
  background-color: ${colors.surface};
`;

const SheetHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const SheetTitle = styled.Text`
  color: ${colors.text};
  font-size: ${fontSize.title}px;
  line-height: ${lineHeight.title}px;
  font-weight: ${fontWeight.heavy};
`;

const SheetBody = styled.ScrollView`
  flex-grow: 0;
`;

const SectionTitle = styled.Text`
  margin-top: ${spacing.lg}px;
  color: ${colors.text};
  font-size: ${fontSize.body}px;
  line-height: ${lineHeight.body}px;
  font-weight: ${fontWeight.heavy};
`;

const SectionDescription = styled.Text`
  margin-top: ${spacing.xs}px;
  color: ${colors.textMuted};
  font-size: ${fontSize.caption}px;
  line-height: ${lineHeight.caption}px;
`;

const ChipWrap = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${spacing.md}px;
  margin-top: ${spacing.md}px;
`;

const SheetChip = styled.Pressable<{
  $selected: boolean;
  $selectedColor: string;
}>`
  min-height: ${size.touchMin}px;
  justify-content: center;
  padding: 0 ${spacing.xl}px;
  border-radius: ${radius.full}px;
  border-width: 1px;
  border-color: ${({ $selected, $selectedColor }) =>
    $selected ? $selectedColor : colors.borderStrong};
  background-color: ${({ $selected, $selectedColor }) =>
    $selected ? $selectedColor : colors.surface};
`;

const SheetChipText = styled.Text<{ $selected: boolean }>`
  color: ${({ $selected }) =>
    $selected ? colors.textOnColor : colors.textSecondary};
  font-size: ${fontSize.label}px;
  font-weight: ${fontWeight.bold};
`;

const SheetFooter = styled.View`
  flex-direction: row;
  gap: ${spacing.md}px;
  margin-top: ${spacing.xl}px;
`;
