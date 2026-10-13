import { useCallback, useMemo, useRef } from 'react';
import type { GestureResponderEvent } from 'react-native';

// 손가락이 이만큼(px) 넘게 움직였으면 탭이 아니라 끌기로 본다.
const TAP_MOVE_LIMIT = 10;

// 화면 내용이 짧아 스크롤이 안 일어나면 ScrollView 가 터치를 가져가지 않는다.
// 그러면 스크롤하려고 끈 손가락을 큰 카드 Pressable 이 탭으로 받아 버린다.
// 카드에 onTouchStart/onTouchMove 를 달고 onPress 에서 isTap() 으로 걸러 낸다.
export function useTapGuard() {
  const startRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  const onTouchStart = useCallback((event: GestureResponderEvent) => {
    startRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    };
    movedRef.current = false;
  }, []);

  const onTouchMove = useCallback((event: GestureResponderEvent) => {
    if (movedRef.current) return;
    const distance = Math.hypot(
      event.nativeEvent.pageX - startRef.current.x,
      event.nativeEvent.pageY - startRef.current.y,
    );
    if (distance > TAP_MOVE_LIMIT) movedRef.current = true;
  }, []);

  // 실제로 스크롤이 시작된 경우(ScrollView onScrollBeginDrag)도 탭이 아니다.
  const markScrolled = useCallback(() => {
    movedRef.current = true;
  }, []);

  const isTap = useCallback(() => !movedRef.current, []);

  return useMemo(
    () => ({ onTouchStart, onTouchMove, markScrolled, isTap }),
    [isTap, markScrolled, onTouchMove, onTouchStart],
  );
}
