import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  highlightPattern,
  createOrMergePdf,
  removePathByPageNumber,
} from "./utils/common";
import { usePdfTextSearch } from "./hooks/usePdfTextSearch";
import PinchZoomLayout from "./components/PinchZoomLayout";
import { PathsType } from "./types/common";
import { webviewApiDataType } from "./types/json";
import clsx from "clsx";
import { useWebviewInterface } from "./hooks/useWebviewInterface";

export default function PdfEngine({
  file,
  setFile,
}: {
  file: webviewApiDataType;
  setFile: Dispatch<SetStateAction<webviewApiDataType>>;
}) {
  const { orientation } = useMobileOrientation();
  const { width, height, ref } = useResizeDetector();
  const scaleRef = useRef<ReactZoomPanPinchContentRef>(null);
  const [searchText, setSearchText] = useState("");
  const [pdfState, setPdfState] = useState({
    isToolBarOpen: false,
    isListOpen: false,
    isFullScreen: false,
    isStrokeOpen: false,
    pageNumber: 1,
    totalPage: 1,
    renderedPageNumber: 0,
    canRenderThumbnail: false,
  });
  const [pdfConfig, setPdfConfig] = useState({
    size: { width: 0, height: 0 },
    strokeStep: 12,
    devicePixelRatio: 2,
  });
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
    zoomEnabled,
    setZoomEnabled,
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
  const pdfDimensions = useMemo(
    () => ({
      width: pdfConfig.size.width,
      height: pdfConfig.size.height,
    }),
    [pdfConfig.size]
  );

  const { getSearchResult } = usePdfTextSearch(pdfFile);
  useWebviewInterface({
    file,
    paths,
    pdfState,
    setPdfState,
    setFile,
    setSearchText,
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
    [canvas, pdfConfig, redrawPaths]
  );

  const onRenderSuccess: OnRenderSuccess = useCallback(() => {
    setPdfState({
      ...pdfState,
      renderedPageNumber: pdfState.pageNumber,
    });
  }, [pdfState]);

  const OnDocumentLoadSuccess: OnDocumentLoadSuccess = useCallback(
    (pdf) => {
      if (!file.isNew) {
        setPdfState({
          ...pdfState,
          totalPage: pdf.numPages,
        });
      }
    },
    [file.isNew, pdfState]
  );

  const textRenderer: CustomTextRenderer = useCallback(
    (textItem) => highlightPattern(textItem.str, searchText),
    [searchText]
  );

  const onNewPageClick = useCallback(async () => {
    const newBase64 = await createOrMergePdf(file.base64);
    setPdfState({
      ...pdfState,
      pageNumber: pdfState.totalPage + 1,
      totalPage: pdfState.totalPage + 1,
    });
    setFile({
      ...file,
      base64: newBase64,
    });
  }, [file, pdfState, setFile]);

  const onEraseAllClick = useCallback(() => {
    if (confirm("변경 사항을 모두 삭제하시겠습니까?")) {
      removePathByPageNumber(paths.current, pdfState.pageNumber);
      canvas.current
        ?.getContext("2d")!
        .clearRect(0, 0, canvas.current.width, canvas.current.height);
    }
  }, [paths, pdfState.pageNumber, canvas]);

  useEffect(() => {
    if (!isRenderLoading && !pdfState.canRenderThumbnail) {
      setPdfState({
        ...pdfState,
        canRenderThumbnail: true,
      });
    }
  }, [isRenderLoading, pdfState]);

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
              width: pdfDimensions.width,
              height: pdfDimensions.height,
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
            disabled={touchType === "touch" && canDraw}
            scale={scale}
            scaleRef={scaleRef}
            pinchZoomRef={ref}
          >
            {isRenderLoading && (
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
            )}
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
            <div className="absolute top-0 left-0 right-0 bottom-0 flex-center">
              <canvas
                ref={canvas}
                key={pdfState.pageNumber}
                style={{
                  width: `${pdfDimensions.width}px`,
                  height: `${pdfDimensions.height}px`,
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
            <ThumbnailOvelay pdfState={pdfState} setPdfState={setPdfState} />
          )}
        </Document>
      </div>
      {!pdfState.isListOpen && pdfState.canRenderThumbnail && (
        <PdfOverlay
          color={color}
          drawType={drawType}
          file={file.base64}
          paths={paths.current}
          touchType={touchType}
          zoomEnabled={zoomEnabled}
          setZoomEnabled={setZoomEnabled}
          setTouchType={setTouchType}
          setCanDraw={setCanDraw}
          setColor={setColor}
          setDrawType={setDrawType}
          onNewPageClick={onNewPageClick}
          onEraseAllClick={onEraseAllClick}
          pdfState={pdfState}
          setPdfState={setPdfState}
          pdfConfig={pdfConfig}
          setPdfConfig={setPdfConfig}
        />
      )}
    </>
  );
}
