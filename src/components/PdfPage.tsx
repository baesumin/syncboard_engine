import { memo, useCallback, useState } from "react";
import { Page } from "react-pdf";
import {
  CustomTextRenderer,
  OnRenderSuccess,
  PageCallback,
} from "react-pdf/src/shared/types.js";
import { highlightPattern } from "../utils/common";
import clsx from "clsx";
import { canvasEventType } from "../types/common";
import PlaceholderPage from "./PlaceholderPage";

interface Props {
  pageNumber: number;
  width: number;
  height: number;
  searchText?: string;
  canDraw?: boolean;
  onPointerDown: (e: canvasEventType) => void;
  onPointerMove: (e: canvasEventType) => void;
  onPointerUp: (e: canvasEventType) => void;
  setRef: (node: HTMLCanvasElement) => void;
  onRenderSuccess: OnRenderSuccess;
}

const PdfPage = ({
  pageNumber,
  width,
  height,
  searchText = "",
  canDraw,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  setRef,
  onRenderSuccess,
}: Props) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleRenderSuccess = useCallback(
    (page: PageCallback) => {
      setIsLoading(false);
      onRenderSuccess?.(page);
    },
    [onRenderSuccess]
  );

  const textRenderer: CustomTextRenderer = useCallback(
    (textItem) => highlightPattern(textItem.str, searchText.trim()),
    [searchText]
  );

  return (
    <div className="bg-slate-300 flex justify-center relative">
      {isLoading && <PlaceholderPage width={width} height={height} />}
      <Page
        pageNumber={pageNumber}
        width={width}
        height={height}
        devicePixelRatio={2}
        onRenderSuccess={handleRenderSuccess}
        customTextRenderer={textRenderer}
        loading={<div style={{ width, height }} />}
        noData={<></>}
      >
        <canvas
          ref={setRef}
          width={width * 2}
          height={height * 2}
          className={clsx(
            "absolute touch-none z-[1000] top-0 w-full h-full",
            canDraw ? "" : "pointer-events-none"
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          data-index={pageNumber}
        />
      </Page>
    </div>
  );
};

export default memo(PdfPage);
