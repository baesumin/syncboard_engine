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
import { PageSizes } from "pdf-lib";

export default function PdfEngine() {
  const { orientation } = useMobileOrientation();
  const { width, ref } = useResizeDetector();
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const scaleRef = useRef<ReactZoomPanPinchContentRef>(null);
  const searchText = useAtomValue(searchTextAtom);
  const file = useAtomValue(fileAtom);
  const [pdfState, setPdfState] = useAtom(pdfStateAtom);
  const [pdfConfig, setPdfConfig] = useAtom(pdfConfigAtom);
  const {
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
    stopDrawing,
    setTouchType,
  } = useCanvas({
    canvasRefs,
    devicePixelRatio: pdfConfig.devicePixelRatio,
    pageSize: pdfConfig.size,
    strokeStep: pdfConfig.strokeStep,
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

  const setRef = useCallback((node: HTMLCanvasElement) => {
    if (node) {
      const indexValue = Number(node.getAttribute("data-index"));
      canvasRefs.current[indexValue] = node;
    }
  }, []);

  const { getSearchResult } = usePdfTextSearch(pdfFile);

  useWebviewInterface({
    paths,
    getSearchResult,
  });

  const OnPageLoadSuccess: OnPageLoadSuccess = useCallback(
    (page) => {
      if (!file.isNew || page.width !== PageSizes.A4[0]) {
        setPdfConfig((prev) => ({
          ...prev,
          size: { width: page.width, height: page.height },
        }));
      }
      scaleRef.current?.resetTransform();
      // if (canvas.current) {
      //   redrawPaths(page.width, page.height);
      // }
    },
    [file.isNew, setPdfConfig]
  );

  const onRenderSuccess: OnRenderSuccess = useCallback(() => {
    setPdfState((prev) => ({
      ...prev,
      renderedPageNumber: prev.pageNumber,
    }));
  }, [setPdfState]);

  const OnDocumentLoadSuccess: OnDocumentLoadSuccess = useCallback(
    (pdf) => {
      if (!file.isNew) {
        setPdfState((prev) => ({
          ...prev,
          totalPage: pdf.numPages,
        }));
      }
    },
    [file.isNew, setPdfState]
  );

  const textRenderer: CustomTextRenderer = useCallback(
    (textItem) => highlightPattern(textItem.str, searchText.trim()),
    [searchText]
  );

  const onEraseAllClick = useCallback(() => {
    if (confirm("해당 페이지의 변경사항을 모두 삭제할까요?")) {
      removePathByPageNumber(paths, pdfState.pageNumber);
      // canvas.current?.getContext("2d")!.reset();
      canvasRefs.current[pdfState.pageNumber]?.getContext("2d")!.reset();
    }
  }, [paths, pdfState.pageNumber]);

  useEffect(() => {
    if (!isRenderLoading && !pdfState.canRenderThumbnail) {
      setPdfState((prev) => ({
        ...prev,
        canRenderThumbnail: true,
      }));
    }
  }, [isRenderLoading, pdfState, setPdfState]);

  useEffect(() => {
    if (file.isNew && !isRenderLoading && pdfState.isDocumentLoading) {
      setPdfState((prev) => ({
        ...prev,
        isDocumentLoading: false,
      }));
    }
  }, [file.isNew, isRenderLoading, pdfState, setPdfState]);

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
      <div className="w-dvw min-h-dvh bg-gray-400">
        {pdfState.isDocumentLoading && file.isNew && (
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
            // disabled={canDraw}
            disabled={false}
            scale={scale}
            scaleRef={scaleRef}
          >
            {/* {isRenderLoading && (
              <Page
                key={pdfState.renderedPageNumber}
                pageNumber={pdfState.renderedPageNumber}
                width={pdfWidth}
                height={pdfHeight}
                devicePixelRatio={pdfConfig.devicePixelRatio}
                customTextRenderer={textRenderer}
                renderAnnotationLayer={false}
                renderTextLayer={file.isNew ? false : true}
                loading={<></>}
                noData={<></>}
              />
            )} */}
            <div
              ref={ref}
              className={clsx(
                "w-dvw flex-center flex-col gap-y-[40px]",
                pdfState.isFullScreen ? "" : "px-[100px] py-[40px]",
                pdfState.totalPage === 1 ? "h-dvh" : ""
              )}
            >
              {[...new Array(pdfState.totalPage)].map((_, index) => {
                return (
                  <div key={index + 1}>
                    <Page
                      // className={isRenderLoading ? "hidden" : ""}
                      className="relative"
                      pageNumber={index + 1}
                      width={pdfWidth}
                      height={pdfConfig.size.height}
                      devicePixelRatio={pdfConfig.devicePixelRatio}
                      onLoadSuccess={OnPageLoadSuccess}
                      onRenderSuccess={onRenderSuccess}
                      customTextRenderer={textRenderer}
                      renderAnnotationLayer={false}
                      renderTextLayer={file.isNew ? false : true}
                      loading={<></>}
                      noData={<></>}
                    >
                      <canvas
                        ref={setRef}
                        width={
                          pdfConfig.size.width * pdfConfig.devicePixelRatio
                        }
                        height={
                          pdfConfig.size.height * pdfConfig.devicePixelRatio
                        }
                        className={clsx(
                          "absolute touch-none z-[1000] top-0 w-full h-full",
                          canDraw ? "" : "pointer-events-none"
                          // isRenderLoading ? "hidden" : ""
                        )}
                        onPointerDown={startDrawing}
                        onPointerMove={draw}
                        onPointerUp={stopDrawing}
                        data-index={index + 1}
                      />
                    </Page>
                  </div>
                );
              })}
            </div>
          </PinchZoomLayout>
          {pdfState.canRenderThumbnail && (
            <ThumbnailOvelay paths={paths.current} />
          )}
        </Document>
      </div>
      {!pdfState.isListOpen && pdfState.canRenderThumbnail && (
        <PdfOverlay
          paths={paths}
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
