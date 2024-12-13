import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { useMobileOrientation } from "react-device-detect";
import {
  CustomTextRenderer,
  OnRenderSuccess,
} from "react-pdf/src/shared/types.js";
import {
  ReactZoomPanPinchContentRef,
  ReactZoomPanPinchRef,
  TransformComponent,
  TransformWrapper,
} from "react-zoom-pan-pinch";
import useCanvas from "./hooks/useCanvas";
import PdfOverlay from "./components/PdfOverlay";
import ThumbnailOvelay from "./components/ThumbnailOvelay";
import { highlightPattern, removeAllPath } from "./utils/common";
import { usePdfTextSearch } from "./hooks/usePdfTextSearch";
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
import { PDF_Y_GAP } from "./contstants/pdf";
import { PDFDocument } from "pdf-lib";
import { useResizeDetector } from "react-resize-detector";

export default function PdfEngine() {
  const { orientation } = useMobileOrientation();
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const scaleRef = useRef<ReactZoomPanPinchContentRef>(null);
  const searchText = useAtomValue(searchTextAtom);
  const file = useAtomValue(fileAtom);
  const [pdfState, setPdfState] = useAtom(pdfStateAtom);
  const [pdfConfig, setPdfConfig] = useAtom(pdfConfigAtom);
  const [currentViewingPage, setCurrentViewingPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const { ref: containerRef, height: containerHeight } = useResizeDetector();

  const { pdfWidth, pdfHeight } = useMemo(() => {
    let width, height;

    if (orientation === "portrait") {
      if (window.outerWidth < pdfConfig.size.width) {
        width = window.outerWidth;
        height = pdfConfig.size.height;
      } else {
        width = pdfConfig.size.width;
        height = pdfConfig.size.height;
      }
    } else {
      if (window.outerHeight < pdfConfig.size.height) {
        width = undefined;
        height = window.outerHeight;
      } else {
        width = pdfConfig.size.width;
        height = window.outerHeight;
      }
    }

    return { pdfWidth: width, pdfHeight: height };
  }, [orientation, pdfConfig.size]);

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
    redrawPaths,
    stopDrawing,
    setTouchType,
  } = useCanvas({
    canvasRefs,
    devicePixelRatio: pdfConfig.devicePixelRatio,
    pageSize: pdfConfig.size,
    strokeStep: pdfConfig.strokeStep,
  });

  const pdfFile = useMemo(
    () => `data:application/pdf;base64,${file.base64}`,
    [file.base64]
  );
  const pdfOptions = useMemo(
    () => ({
      cMapUrl: "/cmaps/",
    }),
    []
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
    scaleRef,
    canvasRefs,
  });

  const onRenderSuccess: OnRenderSuccess = useCallback(
    (page) => {
      if (canvasRefs.current) {
        redrawPaths(page.width, page.height, page.pageNumber);
      }
    },
    [redrawPaths]
  );

  const textRenderer: CustomTextRenderer = useCallback(
    (textItem) => highlightPattern(textItem.str, searchText.trim()),
    [searchText]
  );

  const onEraseAllClick = useCallback(() => {
    if (
      confirm(
        "모두 지우기를 선택하면 문서 전체의 변경 내용이 삭제됩니다. 진행하시겠습니까?"
      )
    ) {
      removeAllPath(paths);
      canvasRefs.current.forEach((canvasRef) => {
        canvasRef
          .getContext("2d")!
          .clearRect(0, 0, canvasRef.width, canvasRef.height);
      });
    }
  }, [paths]);

  const onTransformed = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      scale.current = ref.state.scale;
    },
    [scale]
  );

  const PdfItem = useCallback(
    (_: any, index: number) => {
      return (
        <Page
          pageNumber={index + 1}
          width={pdfWidth}
          height={pdfHeight}
          devicePixelRatio={pdfConfig.devicePixelRatio}
          onRenderSuccess={onRenderSuccess}
          customTextRenderer={textRenderer}
          renderAnnotationLayer={false}
          renderTextLayer={file.isNew ? false : true}
          loading={<div style={{ width: pdfWidth, height: pdfHeight }} />}
          noData={<></>}
        >
          <canvas
            ref={setRef}
            width={pdfConfig.size.width * pdfConfig.devicePixelRatio}
            height={pdfConfig.size.height * pdfConfig.devicePixelRatio}
            className={clsx(
              "absolute touch-none z-[1000] top-0 w-full h-full",
              canDraw ? "" : "pointer-events-none"
            )}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            data-index={index + 1}
          />
        </Page>
      );
    },
    [
      canDraw,
      draw,
      file.isNew,
      onRenderSuccess,
      pdfConfig.devicePixelRatio,
      pdfConfig.size.height,
      pdfConfig.size.width,
      pdfHeight,
      pdfWidth,
      setRef,
      startDrawing,
      stopDrawing,
      textRenderer,
    ]
  );

  useEffect(() => {
    if (file.isNew && pdfState.isDocumentLoading) {
      setPdfState((prev) => ({
        ...prev,
        isDocumentLoading: false,
      }));
    }
  }, [file.isNew, pdfState.isDocumentLoading, setPdfState]);

  useEffect(() => {
    const init = async () => {
      const pdfDoc = await PDFDocument.load(file.base64);
      const page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();

      setPdfConfig((prev) => ({
        ...prev,
        size: { width, height },
      }));
      if (!file.isNew) {
        setPdfState((prev) => ({
          ...prev,
          totalPage: pdfDoc.getPageCount(),
        }));
      }
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
      setInitialLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY;
    const pageHeight = pdfHeight + PDF_Y_GAP; // PDF 높이 + 페이지 간격
    const currentPage = Math.floor(scrollPosition / pageHeight) + 1;
    // console.log(scrollPosition, containerHeight);
    if (currentViewingPage !== currentPage) {
      setCurrentViewingPage(currentPage);
    }
  }, [currentViewingPage, pdfHeight]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [containerHeight, currentViewingPage, handleScroll, pdfHeight]);

  return (
    !initialLoading && (
      <>
        <Document file={pdfFile} loading={<></>} options={pdfOptions}>
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
            centerZoomedOut
          >
            <TransformComponent>
              <div
                ref={containerRef}
                className={clsx(
                  "w-dvw flex items-center flex-col bg-gray-400",
                  pdfState.totalPage === 1
                    ? "h-dvh justify-center"
                    : "min-h-dvh"
                )}
                style={{ rowGap: PDF_Y_GAP }}
              >
                {[...new Array(pdfState.totalPage)].map(PdfItem)}
              </div>
            </TransformComponent>
          </TransformWrapper>
          <ThumbnailOvelay
            paths={paths.current}
            canvasRefs={canvasRefs}
            currentViewingPage={currentViewingPage}
            scaleRef={scaleRef}
          />
        </Document>
        {!pdfState.isListOpen && (
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
            currentViewingPage={currentViewingPage}
          />
        )}
      </>
    )
  );
}
