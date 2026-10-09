import { useState } from 'react';
import { Modal, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleHelp, SlidersHorizontal, X } from 'lucide-react-native';
import Button from './ui/Button.tsx';
import IconButton from './ui/IconButton.tsx';
import {
  ACCESSIBILITY_ALL_LABEL,
  ACCESSIBILITY_SELECTED_COLOR,
  SHELTER_ALL_LABEL,
  SHELTER_SELECTED_COLOR,
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

interface MapFilterBarProps {
  onPressAccessibilityInfo?: () => void;
}

// 지도 상단에 유형·접근성 칩 두 줄이 있으면 360dp 에서 지도가 절반 가까이 가려졌다.
// 한 줄(필터 버튼 + 선택 요약)로 접고, 고르는 건 하단 시트에서 한다.
export default function MapFilterBar({
  onPressAccessibilityInfo,
}: MapFilterBarProps) {
  const { t: translate } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const selectedShelterTypes = useMapFilterStore(
    state => state.selectedShelterTypes,
  );
  const selectedAccessibility = useMapFilterStore(
    state => state.selectedAccessibility,
  );
  const toggleShelterType = useMapFilterStore(state => state.toggleShelterType);
  const toggleAccessibility = useMapFilterStore(
    state => state.toggleAccessibility,
  );
  const applyFilters = useMapFilterStore(state => state.applyFilters);

  const [visible, setVisible] = useState(false);
  // 시트에서 고르는 동안엔 지도를 다시 불러오지 않게 적용 전까지 따로 들고 있는다
  const [draftShelterTypes, setDraftShelterTypes] = useState<string[]>([]);
  const [draftAccessibility, setDraftAccessibility] = useState<string[]>([]);

  const activeShelterTypes = selectedShelterTypes.filter(
    item => item !== SHELTER_ALL_LABEL,
  );
  const activeAccessibility = selectedAccessibility.filter(
    item => item !== ACCESSIBILITY_ALL_LABEL,
  );
  const selectedCount = activeShelterTypes.length + activeAccessibility.length;

  const openSheet = () => {
    setDraftShelterTypes(selectedShelterTypes);
    setDraftAccessibility(selectedAccessibility);
    setVisible(true);
  };

  const closeSheet = () => setVisible(false);

  const resetDraft = () => {
    setDraftShelterTypes([SHELTER_ALL_LABEL]);
    setDraftAccessibility([ACCESSIBILITY_ALL_LABEL]);
  };

  const apply = () => {
    applyFilters(draftShelterTypes, draftAccessibility);
    setVisible(false);
  };

  const summaryItems = [
    ...activeShelterTypes.map(item => ({
      key: `type-${item}`,
      label: translate(shelterTypeFilterLabelKeys[item] ?? item),
      color: SHELTER_SELECTED_COLOR,
      onRemove: () => toggleShelterType(item),
    })),
    ...activeAccessibility.map(item => ({
      key: `a11y-${item}`,
      label: translate(accessibilityFilterLabelKeys[item] ?? item),
      color: ACCESSIBILITY_SELECTED_COLOR,
      onRemove: () => toggleAccessibility(item),
    })),
  ];

  return (
    <Bar>
      <FilterButton
        accessibilityRole="button"
        accessibilityLabel={
          selectedCount
            ? translate('map.filterSheet.buttonSelected', {
                count: selectedCount,
              })
            : translate('map.filterSheet.button')
        }
        $active={selectedCount > 0}
        onPress={openSheet}
      >
        <SlidersHorizontal
          color={selectedCount ? colors.textOnColor : colors.textSecondary}
          size={17}
          strokeWidth={2.4}
        />
        <FilterButtonText $active={selectedCount > 0}>
          {translate('map.filterSheet.button')}
        </FilterButtonText>
        {selectedCount ? (
          <CountBadge>
            <CountBadgeText>{selectedCount}</CountBadgeText>
          </CountBadge>
        ) : null}
      </FilterButton>

      {onPressAccessibilityInfo ? (
        <InfoChip
          accessibilityRole="button"
          accessibilityLabel={translate('map.accessibilityInfo.title')}
          onPress={onPressAccessibilityInfo}
        >
          <InfoChipText numberOfLines={1}>
            {translate('map.accessibilityInfo.label')}
          </InfoChipText>
          <CircleHelp
            color={colors.primaryPressed}
            size={17}
            strokeWidth={2.5}
          />
        </InfoChip>
      ) : null}

      <SummaryScroll
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={summaryContentStyle}
      >
        {summaryItems.length ? (
          summaryItems.map(item => (
            <SummaryChip
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={translate('map.filterSheet.remove', {
                label: item.label,
              })}
              onPress={item.onRemove}
            >
              <SummaryChipBody $color={item.color}>
                <SummaryChipText numberOfLines={1}>
                  {item.label}
                </SummaryChipText>
                <X color={colors.textOnColor} size={14} strokeWidth={2.8} />
              </SummaryChipBody>
            </SummaryChip>
          ))
        ) : (
          <EmptySummaryText numberOfLines={1}>
            {translate('map.filterSheet.noneSelected')}
          </EmptySummaryText>
        )}
      </SummaryScroll>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeSheet}
      >
        <Overlay
          accessible={false}
          importantForAccessibility="no"
          onPress={closeSheet}
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
                {translate('map.filterSheet.title')}
              </SheetTitle>
              <IconButton
                accessibilityLabel={translate('common.close')}
                onPress={closeSheet}
              >
                <X color={colors.textSecondary} size={22} />
              </IconButton>
            </SheetHeader>

            <SheetBody>
              <SectionTitle accessibilityRole="header">
                {translate('map.filterSheet.shelterType')}
              </SectionTitle>
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
                        {translate(accessibilityFilterLabelKeys[item] ?? item)}
                      </SheetChipText>
                    </SheetChip>
                  );
                })}
              </ChipWrap>
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
    </Bar>
  );
}

const summaryContentStyle = {
  alignItems: 'center' as const,
  gap: spacing.sm,
  paddingRight: spacing.xl,
};

const Bar = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: 0 ${spacing.xxl}px;
`;

const FilterButton = styled.Pressable<{ $active: boolean }>`
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
  min-height: ${size.touchMin}px;
  padding: 0 ${spacing.lg}px;
  border-radius: ${radius.full}px;
  border-width: 1px;
  border-color: ${({ $active }) =>
    $active ? colors.primary : colors.borderStrong};
  background-color: ${({ $active }) =>
    $active ? colors.primary : colors.surface};
`;

const FilterButtonText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) =>
    $active ? colors.textOnColor : colors.textSecondary};
  font-size: ${fontSize.label}px;
  font-weight: ${fontWeight.heavy};
`;

const CountBadge = styled.View`
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0 ${spacing.sm}px;
  border-radius: ${radius.full}px;
  background-color: ${colors.surface};
`;

const CountBadgeText = styled.Text`
  color: ${colors.primary};
  font-size: ${fontSize.caption}px;
  font-weight: ${fontWeight.heavy};
`;

const InfoChip = styled.Pressable`
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
  min-height: ${size.touchMin}px;
  padding: 0 ${spacing.lg}px;
  border-radius: ${radius.full}px;
  border-width: 1px;
  border-color: ${colors.primaryBorder};
  background-color: ${colors.primarySoft};
`;

const InfoChipText = styled.Text`
  color: ${colors.primaryPressed};
  font-size: ${fontSize.label}px;
  font-weight: ${fontWeight.bold};
`;

const SummaryScroll = styled.ScrollView`
  flex: 1;
`;

// 스크롤뷰 밖으로 나간 hitSlop 은 안드로이드에서 눌리지 않아서,
// 눌리는 영역은 44로 두고 보이는 칩만 낮게 그린다
const SummaryChip = styled.Pressable`
  min-height: ${size.touchMin}px;
  justify-content: center;
`;

const SummaryChipBody = styled.View<{ $color: string }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
  height: 34px;
  padding: 0 ${spacing.mdPlus}px;
  border-radius: ${radius.full}px;
  background-color: ${({ $color }) => $color};
`;

const SummaryChipText = styled.Text`
  color: ${colors.textOnColor};
  font-size: ${fontSize.caption}px;
  font-weight: ${fontWeight.bold};
`;

const EmptySummaryText = styled.Text`
  color: ${colors.textMuted};
  font-size: ${fontSize.caption}px;
`;

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
