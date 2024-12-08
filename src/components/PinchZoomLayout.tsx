import { MutableRefObject, ReactNode, RefObject, useCallback } from "react";
import {
  ReactZoomPanPinchContentRef,
  ReactZoomPanPinchRef,
  TransformComponent,
  TransformWrapper,
} from "react-zoom-pan-pinch";

interface Props {
  children: ReactNode;
  scale: MutableRefObject<number>;
  scaleRef: RefObject<ReactZoomPanPinchContentRef>;
}

export default function PinchZoomLayout({ children, scale, scaleRef }: Props) {
  const onTransformed = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      scale.current = ref.state.scale;
    },
    [scale]
  );
  const onZoomStop = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      if (ref.state.scale < 1) {
        scaleRef.current?.resetTransform();
      }
    },
    [scaleRef]
  );
  return (
    <TransformWrapper
      ref={scaleRef}
      initialScale={1}
      maxScale={3}
      minScale={0.9}
      disablePadding
      doubleClick={{ disabled: true }}
      onTransformed={onTransformed}
      onZoomStop={onZoomStop}
      limitToBounds={true}
      panning={{
        disabled: true,
      }}
    >
      <TransformComponent>{children}</TransformComponent>
    </TransformWrapper>
  );
}
