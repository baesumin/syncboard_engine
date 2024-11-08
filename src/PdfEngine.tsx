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
  OnRenderSuccess,
} from "react-pdf/src/shared/types.js";
import { ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import useCanvas from "./hooks/useCanvas";
import PdfOverlay from "./components/PdfOverlay";
import ThumbnailOvelay from "./components/ThumbnailOvelay";
import {
  getModifiedPDFBase64,
  highlightPattern,
  __DEV__,
  createOrMergePdf,
} from "./utils/common";
import { usePdfTextSearch } from "./hooks/usePdfTextSearch ";
import PinchZoomLayout from "./components/PinchZoomLayout";
import { webviewType } from "./types/common";
import { webviewApiDataType } from "./types/json";

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
  const [isToolBarOpen, setIsToolBarOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [renderedPageNumber, setRenderedPageNumber] = useState<number>(0);
  const [pageSize, setPageSize] = useState({
    width: 0,
    height: 0,
  });
  const [isListOpen, setIsListOpen] = useState(false);
  const [totalPage, setTotalPage] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isNewPage, setIsNewPage] = useState(false);
  const [strokeStep, setStrokeStep] = useState(12);
  const [devicePixelRatio] = useState(2);
  const [isStrokeOpen, setIsStrokeOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const { getSearchResult } = usePdfTextSearch(file.base64);
  const {
    canvas,
    canDraw,
    setCanDraw,
    paths,
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
    devicePixelRatio,
    pageSize,
    strokeStep,
    pageNumber,
    isRendering,
    setIsRendering,
  });

  const isRenderLoading = useMemo(
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

  const onLoadSuccess: OnDocumentLoadSuccess = useCallback(
    (pdf) => {
      if (!file.isNew) {
        setTotalPage(pdf.numPages);
      }
    },
    [file.isNew]
  );

  const textRenderer: CustomTextRenderer = useCallback(
    (textItem) => highlightPattern(textItem.str, searchText),
    [searchText]
  );

  const onNewPageClick = useCallback(async () => {
    const newBase64 = await createOrMergePdf(file.base64);
    setIsNewPage(true);
    setFile({
      ...file,
      base64: newBase64,
    });
  }, [file, setFile]);

  useEffect(() => {
    if (isNewPage) {
      setIsNewPage(false);
      setPageNumber(totalPage + 1);
      setTotalPage(totalPage + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewPage]);

  useEffect(() => {
    if (isRendering) {
      redrawPaths(pageSize.width, pageSize.height);
    }
  }, [isRendering, pageSize, redrawPaths]);

  useEffect(() => {
    if (!__DEV__) {
      (window as unknown as webviewType).getBase64 = async () => {
        const data = await getModifiedPDFBase64(paths.current, file.base64);
        (window as unknown as webviewType).AndroidInterface.getBase64(data);
      };
      (window as unknown as webviewType).getPathData = () => {
        return JSON.stringify(paths.current);
      };
      (window as unknown as webviewType).newPage = async () => {
        if (!isNewPage) {
          const newBase64 = await createOrMergePdf(file.base64);
          setIsNewPage(true);
          setFile({
            ...file,
            base64: newBase64,
          });
        }
      };
      (window as unknown as webviewType).getSearchText = async (
        data: string
      ) => {
        setIsSearchMode(true);
        setSearchText(data);
      };
      (window as unknown as webviewType).getPageNumber = async (
        data: string
      ) => {
        if (!isNaN(Number(data))) {
          setPageNumber(Number(data));
        }
      };
      (window as unknown as webviewType).endSearch = () => {
        setIsSearchMode(false);
        setSearchText("");
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, isNewPage, setFile]);

  useEffect(() => {
    if (isSearchMode) {
      const resultsList = getSearchResult(searchText);
      (
        window as unknown as webviewType
      ).AndroidInterface?.getSearchTextPageList(
        JSON.stringify(resultsList.map((result) => result.pageNumber))
      );
      setIsSearchMode(false);
    }
  }, [getSearchResult, isSearchMode, searchText]);

  useEffect(() => {
    if (file.paths) {
      paths.current = JSON.parse(file.paths);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="w-dvw h-dvh bg-gray-400 flex-center">
        {isRenderLoading && (
          <div
            className="absolute bg-white"
            style={{
              width: pageSize.width,
              height: pageSize.height,
            }}
          />
        )}
        <Document
          file={`data:application/pdf;base64,${file.base64}`}
          onLoadSuccess={onLoadSuccess}
          loading={<></>}
        >
          <PinchZoomLayout
            isFullScreen={isFullScreen}
            disabled={canDraw}
            scale={scale}
            scaleRef={scaleRef}
            pinchZoomRef={ref}
          >
            {isRenderLoading && (
              <Page
                key={renderedPageNumber}
                pageNumber={renderedPageNumber}
                width={orientation === "portrait" ? width : undefined}
                height={height}
                devicePixelRatio={devicePixelRatio}
                customTextRenderer={textRenderer}
                renderAnnotationLayer={false}
                renderTextLayer={file.isNew ? false : true}
                loading={<></>}
                noData={<></>}
              />
            )}
            <Page
              key={pageNumber}
              className={isRenderLoading ? "hidden" : ""}
              pageNumber={pageNumber}
              width={orientation === "portrait" ? width : undefined}
              height={height}
              devicePixelRatio={devicePixelRatio}
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
                key={pageNumber}
                width={pageSize.width * devicePixelRatio}
                height={pageSize.height * devicePixelRatio}
                style={{
                  width: `${pageSize.width}px`,
                  height: `${pageSize.height}px`,
                  pointerEvents: canDraw ? "auto" : "none",
                  zIndex: 1000,
                  touchAction: "none",
                }}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
              />
            </div>
          </PinchZoomLayout>
          {isListOpen && (
            <ThumbnailOvelay
              scaleRef={scaleRef}
              pageNumber={pageNumber}
              setIsListOpen={setIsListOpen}
              setPageNumber={setPageNumber}
              totalPage={totalPage}
            />
          )}
        </Document>
      </div>
      {!isListOpen && (
        <PdfOverlay
          scaleRef={scaleRef}
          color={color}
          drawType={drawType}
          file={file.base64}
          isFullScreen={isFullScreen}
          isStrokeOpen={isStrokeOpen}
          isToolBarOpen={isToolBarOpen}
          pageNumber={pageNumber}
          paths={paths.current}
          strokeStep={strokeStep}
          totalPage={totalPage}
          touchType={touchType}
          zoomEnabled={zoomEnabled}
          setZoomEnabled={setZoomEnabled}
          setTouchType={setTouchType}
          setCanDraw={setCanDraw}
          setColor={setColor}
          setDrawType={setDrawType}
          setIsFullScreen={setIsFullScreen}
          setIsListOpen={setIsListOpen}
          setIsStrokeOpen={setIsStrokeOpen}
          setIsToolBarOpen={setIsToolBarOpen}
          setPageNumber={setPageNumber}
          setStrokeStep={setStrokeStep}
          onNewPageClick={onNewPageClick}
        />
      )}
    </>
  );
}
