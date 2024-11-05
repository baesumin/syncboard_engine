import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { useResizeDetector } from "react-resize-detector";
import { useMobileOrientation } from "react-device-detect";
import {
  CustomTextRenderer,
  OnRenderSuccess,
} from "react-pdf/src/shared/types.js";
import { ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import { base64 } from "./mock/base64";
import useCanvas from "./hooks/useCanvas";
import PdfOverlay from "./components/PdfOverlay";
import ThumbnailOvelay from "./components/ThumbnailOvelay";
import {
  getModifiedPDFBase64,
  highlightPattern,
  __DEV__,
} from "./utils/common";
import { usePdfTextSearch } from "./hooks/usePdfTextSearch ";
import PinchZoomLayout from "./components/PinchZoomLayout";
import { webviewApiType } from "./types/json";

interface window {
  webviewApi: (data: string) => void;
  getSearchText: (data: string) => void;
  getPageNumber: (data: string) => void;
  getBase64: () => void;
  AndroidInterface: {
    getBase64: (data: string) => void;
    getSearchTextPageList: (data: string) => void;
    setFullMode: (data: boolean) => void;
  };
}

export default function PdfEngine() {
  const { orientation } = useMobileOrientation();
  const { width, height, ref } = useResizeDetector();
  const scaleRef = useRef<ReactZoomPanPinchContentRef>(null);
  const [isToolBarOpen, setIsToolBarOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [renderedPageNumber, setRenderedPageNumber] = useState<number>(0);
  const [file, setFile] = useState(__DEV__ ? base64 : "");
  const [pageSize, setPageSize] = useState({
    width: 0,
    height: 0,
  });
  const [isListOpen, setIsListOpen] = useState(false);
  const [totalPage, setTotalPage] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [strokeStep, setStrokeStep] = useState(12);
  const [devicePixelRatio] = useState(2);
  const [isStrokeOpen, setIsStrokeOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const { resultsList } = usePdfTextSearch(file, searchText);
  const {
    canvas,
    canDraw,
    setCanDraw,
    paths,
    scale,
    isRendering,
    drawType,
    color,
    setColor,
    setDrawType,
    setIsRendering,
    startDrawing,
    draw,
    redrawPaths,
    stopDrawing,
  } = useCanvas({
    devicePixelRatio,
    pageSize,
    strokeStep,
    pageNumber,
  });
  console.log(pageSize);

  const isLoading = useMemo(
    () => renderedPageNumber !== pageNumber,
    [pageNumber, renderedPageNumber]
  );

  const onRenderSuccess: OnRenderSuccess = useCallback(
    (page) => {
      setRenderedPageNumber(pageNumber);
      setIsRendering(true);
      setPageSize({
        width: page.width,
        height: page.height,
      });
    },
    [pageNumber, setIsRendering]
  );

  const textRenderer: CustomTextRenderer = useCallback(
    (textItem) => highlightPattern(textItem.str, searchText),
    [searchText]
  );

  useEffect(() => {
    if (isRendering) {
      redrawPaths(pageSize.width, pageSize.height);
    }
  }, [isRendering, pageSize, redrawPaths]);

  useEffect(() => {
    if (!__DEV__) {
      (window as unknown as window).webviewApi = (appData: string) => {
        const param: webviewApiType = JSON.parse(appData);
        setFile(param?.data?.base64);
      };
      (window as unknown as window).getBase64 = async () => {
        const data = await getModifiedPDFBase64(paths.current, file);
        (window as unknown as window).AndroidInterface.getBase64(data);
      };
      (window as unknown as window).getSearchText = async (data: string) => {
        setSearchText(data);
      };
      (window as unknown as window).getPageNumber = async (data: string) => {
        if (!isNaN(Number(data))) {
          setPageNumber(Number(data));
        }
      };
    }
  }, [file, paths]);

  useEffect(() => {
    if (resultsList.length > 0 && !__DEV__) {
      (window as unknown as window).AndroidInterface.getSearchTextPageList(
        JSON.stringify(resultsList.map((result) => result.pageNumber))
      );
    }
  }, [resultsList]);

  // useEffect(() => {
  //   if (file) {
  //     const getdata = async () => {
  //       const d = await convertAnnotationsToPaths(file, pageSize);
  //       // const d = await convertAnnotationsToPaths(file, pageSize);
  //       // console.log(d);
  //       if (d) {
  //         paths.current = d;
  //         // redrawPaths(pageSize.width, pageSize.height);
  //       }
  //     };
  //     getdata();
  //   }
  // }, [file, pageSize, paths, redrawPaths]);

  return (
    <>
      <div className="w-dvw h-dvh bg-gray-400 flex-center">
        {file && (
          <Document
            file={`data:application/pdf;base64,${file}`}
            onLoadSuccess={(pdf) => {
              setTotalPage(pdf.numPages);
            }}
            loading={<></>}
          >
            <PinchZoomLayout
              isFullScreen={isFullScreen}
              canDraw={canDraw}
              scale={scale}
              scaleRef={scaleRef}
              pinchZoomRef={ref}
            >
              {isLoading && (
                <Page
                  key={renderedPageNumber}
                  pageNumber={renderedPageNumber}
                  width={orientation === "portrait" ? width : undefined}
                  height={height}
                  devicePixelRatio={devicePixelRatio}
                  loading={<></>}
                  noData={<></>}
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                />
              )}
              <Page
                key={pageNumber}
                className={isLoading ? "hidden" : ""}
                pageNumber={pageNumber}
                width={orientation === "portrait" ? width : undefined}
                height={height}
                devicePixelRatio={devicePixelRatio}
                onRenderSuccess={onRenderSuccess}
                loading={<></>}
                noData={<></>}
                customTextRenderer={textRenderer}
                renderAnnotationLayer={true}
                renderTextLayer={true}
              />
              <div className="absolute top-0 left-0 right-0 bottom-0 flex-center">
                <canvas
                  ref={canvas}
                  key={pageNumber}
                  width={pageSize.width * devicePixelRatio}
                  height={pageSize.height * devicePixelRatio}
                  style={{
                    width: `${pageSize.width}px`,
                    height: `${pageSize.height}px`,
                    pointerEvents: canDraw ? "auto" : "none",
                    zIndex: 1000,
                  }}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchCancel={stopDrawing}
                  onTouchEnd={stopDrawing}
                />
              </div>
            </PinchZoomLayout>
            {isListOpen && (
              <ThumbnailOvelay
                pageNumber={pageNumber}
                scaleRef={scaleRef}
                setIsListOpen={setIsListOpen}
                setPageNumber={setPageNumber}
                totalPage={totalPage}
              />
            )}
          </Document>
        )}
      </div>
      {!isListOpen && (
        <PdfOverlay
          color={color}
          drawType={drawType}
          file={file}
          isFullScreen={isFullScreen}
          isStrokeOpen={isStrokeOpen}
          isToolBarOpen={isToolBarOpen}
          pageNumber={pageNumber}
          paths={paths.current}
          strokeStep={strokeStep}
          totalPage={totalPage}
          scaleRef={scaleRef}
          setCanDraw={setCanDraw}
          setColor={setColor}
          setDrawType={setDrawType}
          setIsFullScreen={setIsFullScreen}
          setIsListOpen={setIsListOpen}
          setIsStrokeOpen={setIsStrokeOpen}
          setIsToolBarOpen={setIsToolBarOpen}
          setPageNumber={setPageNumber}
          setStrokeStep={setStrokeStep}
        />
      )}
    </>
  );
}
