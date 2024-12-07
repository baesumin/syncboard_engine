import { MutableRefObject, ReactNode, RefObject, useCallback } from "react";
import {
  ReactZoomPanPinchContentRef,
  ReactZoomPanPinchRef,
  TransformComponent,
  TransformWrapper,
} from "react-zoom-pan-pinch";

interface Props {
  children: ReactNode;
  isFullScreen: boolean;
  disabled: boolean;
  scale: MutableRefObject<number>;
  scaleRef: RefObject<ReactZoomPanPinchContentRef>;
}

export default function PinchZoomLayout({
  children,
  isFullScreen,
  disabled,
  scale,
  scaleRef,
}: Props) {
  const onTransformed = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      scale.current = ref.state.scale;
    },
    [scale]
  );
  return (
    <TransformWrapper
      ref={scaleRef}
      disabled={disabled}
      initialScale={1}
      maxScale={3}
      minScale={!isFullScreen ? 0.9 : 1}
      disablePadding
      doubleClick={{ disabled: true }}
      onTransformed={onTransformed}
      limitToBounds={true}
      panning={{
        disabled: true,
      }}
    >
      <TransformComponent>{children}</TransformComponent>
    </TransformWrapper>
  );
}
