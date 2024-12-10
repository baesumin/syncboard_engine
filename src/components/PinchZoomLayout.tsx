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

  return (
    <TransformWrapper
      ref={scaleRef}
      initialScale={1}
      maxScale={3}
      disablePadding
      doubleClick={{ disabled: true }}
      onTransformed={onTransformed}
      limitToBounds={true}
      panning={{
        disabled: true,
      }}
      // centerZoomedOut
    >
      <TransformComponent>{children}</TransformComponent>
    </TransformWrapper>
  );
}
