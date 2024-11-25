import clsx from "clsx";
import {
  MutableRefObject,
  PointerEvent,
  ReactNode,
  RefObject,
  useCallback,
  useRef,
  useState,
} from "react";
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
  const [isPenTouch, setIsPenTouch] = useState(false);
  const isTouchPanning = useRef(false);

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") {
      isTouchPanning.current = true;
    }
    if (e.pointerType === "pen" && !isTouchPanning.current) {
      setIsPenTouch(true);
    }
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") {
      isTouchPanning.current = false;
    }
    if (e.pointerType === "pen") {
      setIsPenTouch(false);
    }
  }, []);

  const onTransformed = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      scale.current = ref.state.scale;
    },
    [scale]
  );

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <TransformWrapper
        ref={scaleRef}
        disabled={disabled || (isPenTouch && !isTouchPanning.current)}
        initialScale={1}
        maxScale={3}
        minScale={0.7}
        disablePadding
        doubleClick={{ disabled: true }}
        onTransformed={onTransformed}
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
