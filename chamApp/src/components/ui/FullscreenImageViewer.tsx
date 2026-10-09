import type { Dispatch, SetStateAction } from 'react';
import { Modal, type ImageSourcePropType } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { colors, fontSize } from '../../theme/index.ts';

export interface FullscreenImageViewerState {
  images: ImageSourcePropType[];
  index: number;
}

interface FullscreenImageViewerProps {
  value: FullscreenImageViewerState | null;
  // 화면의 setState 를 그대로 받는다. 연속 탭에서도 최신 index 기준으로 넘기려고 함수형 갱신을 쓴다.
  onChange: Dispatch<SetStateAction<FullscreenImageViewerState | null>>;
  resolveSource?: (source: ImageSourcePropType) => ImageSourcePropType;
  onImageError?: (source: ImageSourcePropType) => void;
}

export default function FullscreenImageViewer({
  value,
  onChange,
  resolveSource,
  onImageError,
}: FullscreenImageViewerProps) {
  const { t } = useTranslation();
  const close = () => onChange(null);
  const current = value ? value.images[value.index] : null;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={!!value}
      onRequestClose={close}
    >
      <Overlay onPress={close}>
        <Content pointerEvents="box-none">
          {value && current ? (
            <>
              <ViewerImage
                source={resolveSource ? resolveSource(current) : current}
                onError={onImageError ? () => onImageError(current) : undefined}
                resizeMode="contain"
              />
              <CloseButton
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                onPress={close}
              >
                <X color={colors.textOnColor} size={24} strokeWidth={2.8} />
              </CloseButton>
              {value.images.length > 1 ? (
                <>
                  <NavButton
                    $position="left"
                    accessibilityRole="button"
                    accessibilityLabel={t('common.previousImage')}
                    onPress={() =>
                      onChange(prev =>
                        prev
                          ? {
                              ...prev,
                              index:
                                (prev.index - 1 + prev.images.length) %
                                prev.images.length,
                            }
                          : prev,
                      )
                    }
                  >
                    <ChevronLeft
                      color={colors.textOnColor}
                      size={26}
                      strokeWidth={2.8}
                    />
                  </NavButton>
                  <NavButton
                    $position="right"
                    accessibilityRole="button"
                    accessibilityLabel={t('common.nextImage')}
                    onPress={() =>
                      onChange(prev =>
                        prev
                          ? {
                              ...prev,
                              index: (prev.index + 1) % prev.images.length,
                            }
                          : prev,
                      )
                    }
                  >
                    <ChevronRight
                      color={colors.textOnColor}
                      size={26}
                      strokeWidth={2.8}
                    />
                  </NavButton>
                  <Counter>
                    <CounterText>
                      {value.index + 1}/{value.images.length}
                    </CounterText>
                  </Counter>
                </>
              ) : null}
            </>
          ) : null}
        </Content>
      </Overlay>
    </Modal>
  );
}

const Overlay = styled.Pressable`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${colors.imageViewerBackdrop};
`;

const Content = styled.Pressable`
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

const ViewerImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const CloseButton = styled.Pressable`
  position: absolute;
  top: 46px;
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: rgba(17, 24, 39, 0.68);
`;

const NavButton = styled.Pressable<{
  $position: 'left' | 'right';
}>`
  position: absolute;
  top: 50%;
  ${({ $position }) => `${$position}: 16px;`}
  width: 44px;
  height: 44px;
  margin-top: -22px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.imageViewerControl};
`;

const Counter = styled.View`
  position: absolute;
  right: 16px;
  bottom: 32px;
  padding: 5px 10px;
  border-radius: 999px;
  background-color: rgba(17, 24, 39, 0.72);
`;

const CounterText = styled.Text`
  color: ${colors.textOnColor};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
`;
