import clsx from "clsx";
import { MutableRefObject, ReactNode, RefObject, useCallback } from "react";
import { OnRefChangeType } from "react-resize-detector/build/types/types";
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
  pinchZoomRef: OnRefChangeType<unknown>;
}

export default function PinchZoomLayout({
  children,
  isFullScreen,
  disabled,
  scale,
  scaleRef,
  pinchZoomRef,
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
      minScale={0.7}
      disablePadding
      doubleClick={{ disabled: true }}
      onTransformed={onTransformed}
      limitToBounds={true}
      panning={{
        velocityDisabled: true,
      }}
      alignmentAnimation={{
        disabled: true,
      }}
    >
      <TransformComponent>
        <div
          ref={pinchZoomRef}
          className={clsx(
            "w-dvw h-dvh flex-center",
            isFullScreen ? "" : "px-[100px] py-[40px]"
          )}
        >
          {children}
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
}
