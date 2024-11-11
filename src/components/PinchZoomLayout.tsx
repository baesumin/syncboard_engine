import clsx from "clsx";
import {
  MutableRefObject,
  PointerEvent,
  ReactNode,
  RefObject,
  useCallback,
  useState,
} from "react";
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
  const [isPenTouch, setIsPenTouch] = useState(false);

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "pen") {
      setIsPenTouch(true);
    }
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "pen") {
      setIsPenTouch(false);
    }
  }, []);

  return (
    <div onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <TransformWrapper
        ref={scaleRef}
        disabled={disabled || isPenTouch}
        initialScale={1}
        maxScale={3}
        minScale={1}
        disablePadding
        doubleClick={{ disabled: true }}
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
            className={clsx(
              "w-dvw h-dvh flex-center",
              isFullScreen ? "" : "px-[100px] py-[40px]"
            )}
          >
            {children}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
