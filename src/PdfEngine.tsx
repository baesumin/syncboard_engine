import { useCallback, useEffect, useMemo, useRef } from "react";
import { Document, Page } from "react-pdf";
import { useResizeDetector } from "react-resize-detector";
import { useMobileOrientation } from "react-device-detect";
import {
  CustomTextRenderer,
  OnDocumentLoadSuccess,
  OnPageLoadSuccess,
  OnRenderSuccess,
} from "react-pdf/src/shared/types.js";
import { ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import useCanvas from "./hooks/useCanvas";
import PdfOverlay from "./components/PdfOverlay";
import ThumbnailOvelay from "./components/ThumbnailOvelay";
import { highlightPattern, removePathByPageNumber } from "./utils/common";
import { usePdfTextSearch } from "./hooks/usePdfTextSearch";
import PinchZoomLayout from "./components/PinchZoomLayout";
import { PathsType } from "./types/common";
import clsx from "clsx";
import { useWebviewInterface } from "./hooks/useWebviewInterface";
import { useAtom, useAtomValue } from "jotai";
import {
  fileAtom,
  pdfConfigAtom,
  pdfStateAtom,
  searchTextAtom,
} from "./store/pdf";

export default function PdfEngine() {
  const { orientation } = useMobileOrientation();
  const { width, height, ref } = useResizeDetector();
  const scaleRef = useRef<ReactZoomPanPinchContentRef>(null);
  const searchText = useAtomValue(searchTextAtom);
  const file = useAtomValue(fileAtom);
  const [pdfState, setPdfState] = useAtom(pdfStateAtom);
  const [pdfConfig, setPdfConfig] = useAtom(pdfConfigAtom);
  const {
    canvas,
    canDraw,
    setCanDraw,
    paths,
    drawOrder,
    scale,
    drawType,
    color,
    touchType,
    setColor,
    setDrawType,
    startDrawing,
    draw,
    redrawPaths,
    stopDrawing,
    setTouchType,
  } = useCanvas({
    devicePixelRatio: pdfConfig.devicePixelRatio,
    pageSize: pdfConfig.size,
    strokeStep: pdfConfig.strokeStep,
    pageNumber: pdfState.pageNumber,
  });

  const isRenderLoading = useMemo(
    () => pdfState.renderedPageNumber !== pdfState.pageNumber,
    [pdfState.pageNumber, pdfState.renderedPageNumber]
  );
  const pdfWidth = useMemo(
    () => (orientation === "portrait" ? width : undefined),
    [orientation, width]
  );
  const pdfFile = useMemo(
    () => `data:application/pdf;base64,${file.base64}`,
    [file.base64]
  );

  const { getSearchResult } = usePdfTextSearch(pdfFile);

  useWebviewInterface({
    paths,
    getSearchResult,
  });

  const OnPageLoadSuccess: OnPageLoadSuccess = useCallback(
    (page) => {
      setPdfConfig({
        ...pdfConfig,
        size: { width: page.width, height: page.height },
      });
      scaleRef.current?.resetTransform();
      if (canvas.current) {
        canvas.current.width = page.width * pdfConfig.devicePixelRatio;
        canvas.current.height = page.height * pdfConfig.devicePixelRatio;
        redrawPaths(page.width, page.height);
      }
    },
    [canvas, pdfConfig, redrawPaths, setPdfConfig]
  );

  const onRenderSuccess: OnRenderSuccess = useCallback(() => {
    setPdfState({
      ...pdfState,
      renderedPageNumber: pdfState.pageNumber,
    });
  }, [pdfState, setPdfState]);

  const OnDocumentLoadSuccess: OnDocumentLoadSuccess = useCallback(
    (pdf) => {
      if (!file.isNew) {
        setPdfState({
          ...pdfState,
          totalPage: pdf.numPages,
        });
      }
    },
    [file.isNew, pdfState, setPdfState]
  );

  const textRenderer: CustomTextRenderer = useCallback(
    (textItem) => highlightPattern(textItem.str, searchText),
    [searchText]
  );

  const onEraseAllClick = useCallback(() => {
    if (confirm("변경 사항을 모두 삭제하시겠습니까?")) {
      removePathByPageNumber(paths.current, pdfState.pageNumber);
      canvas.current?.getContext("2d")!.reset();
    }
  }, [paths, pdfState.pageNumber, canvas]);

  useEffect(() => {
    if (!isRenderLoading && !pdfState.canRenderThumbnail) {
      setPdfState({
        ...pdfState,
        canRenderThumbnail: true,
      });
    }
  }, [isRenderLoading, pdfState, setPdfState]);

  useEffect(() => {
    if (file.paths) {
      const savedPaths: { [pageNumber: number]: PathsType[] } = JSON.parse(
        file.paths
      );

      const maxDrawOrderItem = Object.values(savedPaths)
        .flat()
        .reduce(
          (maxItem, currentItem) => {
            return currentItem.drawOrder > maxItem.drawOrder
              ? currentItem
              : maxItem;
          },
          { drawOrder: 0 }
        );
      paths.current = savedPaths;
      drawOrder.current = maxDrawOrderItem.drawOrder;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="w-dvw h-dvh bg-gray-400 flex-center">
        {isRenderLoading && file.isNew && (
          <div
            className="absolute bg-white"
            style={{
              width: pdfConfig.size.width,
              height: pdfConfig.size.height,
            }}
          />
        )}
        <Document
          file={pdfFile}
          onLoadSuccess={OnDocumentLoadSuccess}
          loading={<></>}
        >
          <PinchZoomLayout
            isFullScreen={pdfState.isFullScreen}
            disabled={canDraw}
            scale={scale}
            scaleRef={scaleRef}
            pinchZoomRef={ref}
          >
            {/* {isRenderLoading && (
              <Page
                key={pdfState.renderedPageNumber}
                pageNumber={pdfState.renderedPageNumber}
                width={pdfWidth}
                height={height}
                devicePixelRatio={pdfConfig.devicePixelRatio}
                customTextRenderer={textRenderer}
                renderAnnotationLayer={false}
                renderTextLayer={file.isNew ? false : true}
                loading={<></>}
                noData={<></>}
              />
            )} */}
            <Page
              key={pdfState.pageNumber}
              className={isRenderLoading ? "hidden" : ""}
              pageNumber={pdfState.pageNumber}
              width={pdfWidth}
              height={height}
              devicePixelRatio={pdfConfig.devicePixelRatio}
              onLoadSuccess={OnPageLoadSuccess}
              onRenderSuccess={onRenderSuccess}
              customTextRenderer={textRenderer}
              renderAnnotationLayer={false}
              renderTextLayer={file.isNew ? false : true}
              loading={<></>}
              noData={<></>}
            />
            <div className="absolute flex-center">
              <canvas
                ref={canvas}
                key={pdfState.pageNumber}
                style={{
                  width: `${pdfConfig.size.width}px`,
                  height: `${pdfConfig.size.height}px`,
                }}
                className={clsx(
                  "touch-none z-[1000]",
                  canDraw ? "pointer-events-auto" : "pointer-events-none"
                )}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
              />
            </div>
          </PinchZoomLayout>
          {pdfState.canRenderThumbnail && (
            <ThumbnailOvelay paths={paths.current} />
          )}
        </Document>
      </div>
      {!pdfState.isListOpen && pdfState.canRenderThumbnail && (
        <PdfOverlay
          color={color}
          drawType={drawType}
          touchType={touchType}
          setTouchType={setTouchType}
          setCanDraw={setCanDraw}
          setColor={setColor}
          setDrawType={setDrawType}
          onEraseAllClick={onEraseAllClick}
        />
      )}
    </>
  );
}
