import { MutableRefObject, ReactNode, RefObject } from "react";
import { OnRefChangeType } from "react-resize-detector/build/types/types";
import {
  ReactZoomPanPinchContentRef,
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
  return (
    <TransformWrapper
      ref={scaleRef}
      disabled={disabled}
      initialScale={1}
      maxScale={3}
      minScale={1}
      disablePadding
      onPinchingStop={(ref) => {
        scale.current = ref.state.scale;
        // 1 ~3
        // 1일때 0 3일때 1
        // setDevicePixelRatio(2 + ref.state.scale * 0.33);
      }}
    >
      <TransformComponent>
        <div
          ref={pinchZoomRef}
          className="w-dvw h-dvh flex-center"
          style={{
            paddingLeft: isFullScreen ? 0 : 100,
            paddingRight: isFullScreen ? 0 : 100,
            paddingTop: isFullScreen ? 0 : 40,
            paddingBottom: isFullScreen ? 0 : 40,
          }}
        >
          {children}
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
}
