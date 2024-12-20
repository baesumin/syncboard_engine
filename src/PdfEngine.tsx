import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document } from "react-pdf";
import {
  OnItemClickArgs,
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
import { getReducedPdfSize, removeAllPath } from "./utils/common";
import { usePdfTextSearch } from "./hooks/usePdfTextSearch";
import { PathsType } from "./types/common";
import { useWebviewInterface } from "./hooks/useWebviewInterface";
import { useAtom, useAtomValue } from "jotai";
import {
  fileAtom,
  pdfConfigAtom,
  pdfStateAtom,
  searchTextAtom,
} from "./store/pdf";
import { PDFDocument } from "pdf-lib";
import { FixedSizeList as List, ListOnScrollProps } from "react-window";
import Row from "./components/Row";
import { useWindowSize } from "./hooks/useWIndowSIze";

export default function PdfEngine() {
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const scaleRef = useRef<ReactZoomPanPinchContentRef>(null);
  const [currentViewingPage, setCurrentViewingPage] = useState(1);
  const listRef = useRef<List>(null);
  const searchText = useAtomValue(searchTextAtom);
  const file = useAtomValue(fileAtom);
  const [pdfState, setPdfState] = useAtom(pdfStateAtom);
  const [pdfConfig, setPdfConfig] = useAtom(pdfConfigAtom);
  const [initialLoading, setInitialLoading] = useState(true);

  const pdfSize = useMemo(() => {
    const reducedSize = getReducedPdfSize(
      pdfConfig.size.width,
      pdfConfig.size.height,
      windowWidth - 128,
      windowHeight - 84
    );
    return { width: reducedSize.width, height: reducedSize.height };
  }, [pdfConfig.size, windowWidth, windowHeight]);

  const {
    canDraw,
    paths,
    drawOrder,
    scale,
    drawType,
    color,
    touchType,
    isWrongTouch,
    setIsWrongTouch,
    setCanDraw,
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
    pageSize: { width: pdfSize.width, height: pdfSize.height },
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
  const containerHeight = useMemo(
    () => (pdfSize.height + 10) * pdfState.totalPage,
    [pdfSize.height, pdfState.totalPage]
  );
  const listStyle = useMemo(
    () =>
      pdfState.totalPage === 1
        ? {
            height: windowHeight,
            top: Math.max((windowHeight - pdfSize.height) / 2, 0),
          }
        : {},
    [pdfSize.height, pdfState.totalPage, windowHeight]
  );

  const { getSearchResult } = usePdfTextSearch(pdfFile);
  useWebviewInterface({
    paths,
    getSearchResult,
    scaleRef,
    listRef,
  });

  const setRef = useCallback((node: HTMLCanvasElement) => {
    if (node) {
      const indexValue = Number(node.getAttribute("data-index"));
      canvasRefs.current[indexValue] = node;
    }
  }, []);

  const onRenderSuccess: OnRenderSuccess = useCallback(
    (page) => {
      if (canvasRefs.current) {
        redrawPaths(page.width, page.height, page.pageNumber);
      }
    },
    [redrawPaths]
  );

  const itemData = useMemo(
    () => ({
      pdfSize,
      searchText,
      setRef,
      onPointerDown: startDrawing,
      onPointerMove: draw,
      onPointerUp: stopDrawing,
      canDraw,
      onRenderSuccess,
    }),
    [
      canDraw,
      draw,
      onRenderSuccess,
      pdfSize,
      searchText,
      setRef,
      startDrawing,
      stopDrawing,
    ]
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

  const onZoomStop = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      scale.current = ref.state.scale;
    },
    [scale]
  );

  const onThumbnailClick = useCallback(
    (args: OnItemClickArgs) => {
      setPdfState((prev) => ({
        ...prev,
        isListOpen: false,
      }));
      scaleRef.current?.resetTransform(0);
      listRef.current?.scrollToItem(args.pageIndex, "start");
    },
    [setPdfState]
  );

  const onScroll = useCallback(
    (props: ListOnScrollProps) => {
      requestAnimationFrame(() => {
        const scrollPosition = props.scrollOffset + 5;
        const scrollRatio = scrollPosition / containerHeight;
        const currentPage = Math.min(
          Math.floor(scrollRatio * pdfState.totalPage) + 1,
          pdfState.totalPage
        );

        const isNearBottom =
          scrollPosition + windowHeight + 50 >= containerHeight;

        if (isNearBottom) {
          setCurrentViewingPage(pdfState.totalPage);
        } else {
          if (currentViewingPage !== currentPage) {
            setCurrentViewingPage(currentPage);
          }
        }
      });
    },
    [containerHeight, currentViewingPage, pdfState.totalPage, windowHeight]
  );

  useEffect(() => {
    const init = async () => {
      const pdfDoc = await PDFDocument.load(file.base64);
      const page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();

      setPdfConfig((prev) => ({
        ...prev,
        size: { width: Math.floor(width), height: Math.floor(height) },
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

  return (
    <Document file={pdfFile} loading={<></>} options={pdfOptions}>
      {!initialLoading && (
        <div className="bg-[#94A3B8] min-h-dvh flex-center">
          <TransformWrapper
            ref={scaleRef}
            initialScale={1}
            maxScale={3}
            disablePadding
            doubleClick={{ disabled: true }}
            onZoomStop={onZoomStop}
            limitToBounds={true}
            panning={{
              disabled: true,
            }}
            centerZoomedOut
          >
            <TransformComponent>
              <List
                ref={listRef}
                onScroll={onScroll}
                itemCount={pdfState.totalPage}
                itemSize={pdfSize.height + 10}
                width={windowWidth}
                height={windowHeight}
                itemData={itemData}
                className="overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-300 hover:scrollbar-thumb-gray-500"
                style={listStyle}
              >
                {Row}
              </List>
            </TransformComponent>
          </TransformWrapper>
        </div>
      )}
      <ThumbnailOvelay
        paths={paths.current}
        currentViewingPage={currentViewingPage}
        pdfSize={pdfSize}
        onThumbnailClick={onThumbnailClick}
      />
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
          isWrongTouch={isWrongTouch}
          setIsWrongTouch={setIsWrongTouch}
        />
      )}
    </Document>
  );
}
