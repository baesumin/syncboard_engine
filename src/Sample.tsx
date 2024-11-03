import { useEffect, useRef, useState } from "react";
import { Document, Page, Thumbnail } from "react-pdf";
import { useResizeDetector } from "react-resize-detector";
import { useMobileOrientation, isMobile } from "react-device-detect";
import { OnRenderSuccess } from "react-pdf/src/shared/types.js";
import { colorMap, getModifiedPDFBase64, postMessage } from "./utils";
import {
  ReactZoomPanPinchContentRef,
  TransformComponent,
  TransformWrapper,
} from "react-zoom-pan-pinch";
import FullScreen from "./assets/ico-fullscreen.svg?react";
import SmallScreen from "./assets/ico-maximize.svg?react";
import ThumbnailList from "./assets/ico-thumb-documnet.svg?react";
import ArrowLeft from "./assets/ico-arrow-left.svg?react";
import Close from "./assets/ico-close.svg?react";
import Drawing from "./assets/ico-drawing.svg?react";
import Pen from "./assets/ico-pen.svg?react";
import Hightlighter from "./assets/ico-hightlighter.svg?react";
import Eraser from "./assets/ico-eraser.svg?react";
import Checked from "./assets/ico-checked.svg?react";
import Stroke from "./assets/ico-stroke.svg?react";
import Stroke1Step from "./assets/ico-stroke-1step.svg?react";
import Stroke2Step from "./assets/ico-stroke-2step.svg?react";
import Stroke3Step from "./assets/ico-stroke-3step.svg?react";
import Stroke4Step from "./assets/ico-stroke-4step.svg?react";
import Stroke5Step from "./assets/ico-stroke-5step.svg?react";
import Zoom from "./assets/ico-zoom.svg?react";
import clsx from "clsx";
import { base64 } from "./base64";

import useCanvas from "./hooks/useCanvas";

interface window {
  webviewApi: (data: string) => void;
  getBase64: () => void;
  AndroidInterface: {
    getBase64: (data: string) => void;
    setFullMode: (data: boolean) => void;
  };
}

export default function Sample() {
  const { orientation } = useMobileOrientation();
  const { width, height, ref } = useResizeDetector();
  const scaleRef = useRef<ReactZoomPanPinchContentRef>(null);
  const [isToolBarOpen, setIsToolBarOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [renderedPageNumber, setRenderedPageNumber] = useState<number>(0);
  const [file, setFile] = useState(
    import.meta.env.MODE === "development" ? base64 : ""
  );
  const [color, setColor] = useState<(typeof colorMap)[number]>("#F34A47");
  const [pageSize, setPageSize] = useState({
    width: 0,
    height: 0,
  });
  const [isListOpen, setIsListOpen] = useState(false);
  const [totalPage, setTotalPage] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [drawType, setDrawType] = useState<
    "pen" | "highlight" | "eraser" | "zoom"
  >("pen");
  const [strokeStep, setStrokeStep] = useState(12);
  const [devicePixelRatio] = useState(2);
  const [isStrokeOpen, setIsStrokeOpen] = useState(false);
  // const [searchText] = useState("");
  // const { resultsList, totalLength, findPageByIndex } = usePdfTextSearch(
  //   file,
  //   searchText
  // );
  // const [isSearchMode] = useState(false);
  // const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const isLoading = renderedPageNumber !== pageNumber;
  // const matchIndex = useRef(0);

  const {
    canvas,
    canDraw,
    setCanDraw,
    paths,
    scale,
    isRendering,
    setIsRendering,
    startDrawing,
    draw,
    redrawPaths,
    stopDrawing,
  } = useCanvas({
    devicePixelRatio,
    pageSize,
    drawType,
    color,
    strokeStep,
    pageNumber,
  });

  const onRenderSuccess: OnRenderSuccess = (page) => {
    setRenderedPageNumber(pageNumber);
    setIsRendering(true);
    setPageSize({
      width: page.width,
      height: page.height,
    });
  };

  useEffect(() => {
    if (isRendering) {
      redrawPaths(pageSize.width, pageSize.height);
    }
  }, [isRendering, pageSize, redrawPaths]);

  useEffect(() => {
    if (!isMobile || import.meta.env.MODE === "development") {
      setFile(base64);
    }
  }, []);

  // useEffect(() => {
  //   if (isSearchMode) {
  //     const pageNumber = findPageByIndex(currentSearchIndex);
  //     setPageNumber(pageNumber);
  //   }
  // }, [currentSearchIndex, findPageByIndex, isSearchMode]);

  useEffect(() => {
    if (isMobile) {
      (window as unknown as window).webviewApi = (data: string) => {
        const param = JSON.parse(data);
        setFile(param?.data?.base64);
      };
      (window as unknown as window).getBase64 = async () => {
        const data = await getModifiedPDFBase64(paths.current, file);
        (window as unknown as window).AndroidInterface.getBase64(data);
      };
    }
  }, [file, paths]);

  // useEffect(() => {
  //   const getData = async () => {
  //     const d = await loadPDFAnnotations(annotBase64);
  //     // console.log(d);
  //   };
  //   getData();
  // });

  // const textRenderer: CustomTextRenderer = useCallback(
  //   (textItem) => {
  //     if (!searchText || !resultsList.length) return textItem.str;

  //     const currentPageResult = resultsList.find(
  //       (result) => result.pageNumber === pageNumber
  //     );
  //     if (!currentPageResult) return textItem.str;

  //     // 현재 텍스트에 검색어가 포함되어 있는지 확인
  //     const regex = new RegExp(searchText, "gi");
  //     if (!regex.test(textItem.str)) return textItem.str;

  //     // 현재 페이지 내에서의 검색어 순서를 추적
  //     matchIndex.current = currentPageResult.indices[0];
  //     return textItem.str.replace(regex, (match) => {
  //       // console.log(matchIndex);
  //       const isCurrentMatch = matchIndex.current === currentSearchIndex;
  //       matchIndex.current += 1;
  //       return `<mark style="background:${
  //         isCurrentMatch ? "#FFB84D" : "#FFF600"
  //       } !important">${match}</mark>`;
  //     });
  //   },
  //   [searchText, currentSearchIndex, resultsList, pageNumber]
  // );

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
            <TransformWrapper
              ref={scaleRef}
              disabled={canDraw}
              initialScale={1}
              maxScale={3}
              minScale={1}
              disablePadding
              onPinchingStop={(ref) => {
                scale.current = ref.state.scale;
                // 1 ~3
                // 1일때 0 3일때 1
                // setDevicePixelRatio(2 + ref.state.scale * 0.33);
              }}
            >
              <TransformComponent>
                <div
                  ref={ref}
                  className="w-dvw h-dvh flex-center"
                  style={{
                    paddingLeft: isFullScreen ? 0 : 100,
                    paddingRight: isFullScreen ? 0 : 100,
                    paddingTop: isFullScreen ? 0 : 40,
                    paddingBottom: isFullScreen ? 0 : 40,
                  }}
                >
                  <>
                    {isLoading && (
                      <Page
                        key={renderedPageNumber}
                        pageNumber={renderedPageNumber}
                        width={orientation === "portrait" ? width : undefined}
                        height={height}
                        devicePixelRatio={devicePixelRatio}
                        loading={<></>}
                        noData={<></>}
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
                      // customTextRenderer={textRenderer}
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
                  </>
                </div>
              </TransformComponent>
            </TransformWrapper>
            {isListOpen && (
              <div
                className={clsx(
                  "absolute top-0 left-0 bottom-0 right-0 overflow-auto bg-black/70 px-[20px] pt-[24px]"
                )}
              >
                <div className="flex justify-end items-center">
                  <button
                    onClick={() => setIsListOpen(false)}
                    className="bg-white size-[44px] flex-center rounded-xl"
                  >
                    <Close />
                  </button>
                </div>
                <div
                  className="grid mt-[20px] gap-y-5"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                  }}
                >
                  {[...new Array(totalPage)].map((_, index) => {
                    return (
                      <div key={index} className="w-[180px]">
                        <div
                          className={clsx(
                            pageNumber === index + 1
                              ? "border-[3px] border-[#FF9A51]"
                              : "",
                            "overflow-hidden"
                          )}
                        >
                          <Thumbnail
                            pageNumber={index + 1}
                            width={180}
                            devicePixelRatio={2}
                            onItemClick={({ pageNumber }) => {
                              scaleRef.current?.resetTransform(0);
                              setPageNumber(pageNumber);
                              setIsListOpen(false);
                            }}
                            loading={<></>}
                          />
                        </div>
                        <div className="h-[31px] flex justify-center items-center">
                          <span
                            className={
                              pageNumber === index + 1
                                ? "text-[#FF9A51] font-bold text-lg"
                                : "text-white"
                            }
                          >
                            {index + 1}/{totalPage}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Document>
        )}
      </div>
      {!isListOpen && (
        <>
          <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col justify-between px-[20px] py-[20px] pointer-events-none">
            <div className="flex h-[52px] justify-between items-center">
              <button
                onClick={() => setIsListOpen(true)}
                className="pointer-events-auto h-[48px] rounded-[10px] bg-[#202325]/70 flex items-center pl-[2px] pr-4 gap-3"
              >
                <div className="size-[44px] bg-white rounded-lg flex-center">
                  <ThumbnailList />
                </div>
                <span className="text-white text-lg">{`${pageNumber}/${totalPage}`}</span>
              </button>
              {/* TODO: 나중에 없애기 */}
              {/* {!isMobile && (
                <div className="flex -mt-10 gap-x-2">
                  <button
                    onClick={() => {
                      if (currentSearchIndex !== 0) {
                        setCurrentSearchIndex((prev) => prev - 1);
                      } else {
                        setCurrentSearchIndex(totalLength - 1);
                      }
                    }}
                    className="pointer-events-auto h-[48px] rounded-[10px] bg-white flex-center"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => {
                      if (currentSearchIndex === totalLength - 1) {
                        setCurrentSearchIndex(0);
                      } else {
                        setCurrentSearchIndex((prev) => prev + 1);
                      }
                    }}
                    className="pointer-events-auto h-[48px] rounded-[10px] bg-white flex-center"
                  >
                    다음
                  </button>
                </div>
              )} */}

              <button
                onClick={() => {
                  postMessage("fullScreen");
                  setIsFullScreen((prev) => !prev);
                  (window as unknown as window).AndroidInterface.setFullMode(
                    !isFullScreen
                  );
                }}
                className="pointer-events-auto size-[44px] rounded-lg bg-white shadow-black shadow-sm flex-center"
              >
                {isFullScreen ? <SmallScreen /> : <FullScreen />}
              </button>
            </div>

            <div className="flex justify-between mx-[-20px]">
              <button
                onClick={() => {
                  if (pageNumber !== 1) {
                    scaleRef.current?.resetTransform(0);
                    setPageNumber((prev) => prev - 1);
                  }
                }}
                className="pointer-events-auto w-[80px] h-[160px] rounded-tr-[100px] rounded-br-[100px] bg-[#56657E]/50 flex-center text-white"
              >
                <ArrowLeft color={pageNumber === 1 ? "#BCC2CB" : "white"} />
              </button>
              <button
                onClick={() => {
                  if (pageNumber !== totalPage) {
                    scaleRef.current?.resetTransform(0);
                    setPageNumber((prev) => prev + 1);
                  }
                }}
                className="pointer-events-auto w-[80px] h-[160px] rounded-tl-[100px] rounded-bl-[100px] bg-[#56657E]/50 flex-center text-white"
              >
                <div className="rotate-180">
                  <ArrowLeft
                    color={pageNumber === totalPage ? "#BCC2CB" : "white"}
                  />
                </div>
              </button>
            </div>

            <div className="flex h-[56px] justify-center">
              {!isToolBarOpen && (
                <button
                  onClick={() => {
                    setCanDraw((prev) => !prev);
                    setIsToolBarOpen(true);
                  }}
                  className="pointer-events-auto w-[114px] h-[56px] rounded-xl bg-white shadow-black shadow-sm flex-center gap-[9px]"
                >
                  <Drawing />
                  그리기
                </button>
              )}
              {!isToolBarOpen && import.meta.env.MODE === "development" && (
                <button
                  onClick={async () => {
                    await getModifiedPDFBase64(paths.current, file);
                  }}
                  className="pointer-events-auto w-[114px] h-[56px] rounded-xl bg-white shadow-black shadow-sm flex-center gap-[9px]"
                >
                  <Drawing />
                  저장
                </button>
              )}
              {isToolBarOpen && (
                <div className="h-[56px] bg-white rounded-xl flex items-center px-[8px] shadow-black shadow-sm">
                  <div className="w-[140px] flex justify-between">
                    <button
                      onClick={() => {
                        setCanDraw(true);
                        setDrawType("pen");
                      }}
                      className={clsx(
                        "pointer-events-auto size-[44px] rounded-lg flex-center",
                        drawType === "pen" ? "bg-[#5865FA]" : "#ffffff"
                      )}
                    >
                      <Pen color={drawType === "pen" ? "#ffffff" : "#353B45"} />
                    </button>
                    <button
                      onClick={() => {
                        setCanDraw(true);
                        setDrawType("highlight");
                      }}
                      className={clsx(
                        "pointer-events-auto size-[44px] rounded-lg flex-center",
                        drawType === "highlight" ? "bg-[#5865FA]" : "#ffffff"
                      )}
                    >
                      <Hightlighter
                        color={drawType === "highlight" ? "#ffffff" : "#353B45"}
                      />
                    </button>
                    <button
                      onClick={() => {
                        setCanDraw(true);
                        setDrawType("eraser");
                      }}
                      className={clsx(
                        "pointer-events-auto size-[44px] rounded-lg flex-center",
                        drawType === "eraser" ? "bg-[#5865FA]" : "#ffffff"
                      )}
                    >
                      <Eraser
                        color={drawType === "eraser" ? "#ffffff" : "#353B45"}
                      />
                    </button>
                  </div>
                  <div className="w-[1px] h-[40px] bg-[#EEEFF3] mx-[8px]" />
                  <div className="flex flex-row w-[220px] justify-between">
                    {colorMap.map((item) => {
                      return (
                        <div
                          key={item}
                          className="pointer-events-auto size-[44px] flex-center"
                          onClick={() => {
                            setColor(item);
                          }}
                        >
                          <div
                            className="rounded-full size-[24px] flex-center"
                            style={{ backgroundColor: item }}
                          >
                            {drawType !== "eraser" && item === color && (
                              <Checked color={"white"} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-[1px] h-[40px] bg-[#EEEFF3] mx-[8px]" />
                  <button
                    onClick={() => setIsStrokeOpen((prev) => !prev)}
                    className={clsx(
                      "pointer-events-auto size-[44px] rounded-lg flex-center",
                      isStrokeOpen ? "bg-[#EEEFF3]" : "#ffffff"
                    )}
                  >
                    <Stroke />
                    {isStrokeOpen && (
                      <div className="bg-white w-[60px] h-[236px] absolute bottom-[70px] rounded-lg shadow-black shadow-sm flex flex-col justify-center items-center">
                        <button
                          onClick={() => setStrokeStep(20)}
                          className={
                            "pointer-events-auto size-[44px] flex-center"
                          }
                        >
                          <Stroke5Step
                            color={strokeStep === 20 ? color : "#BCC2CB"}
                          />
                        </button>
                        <button
                          onClick={() => setStrokeStep(16)}
                          className="pointer-events-auto size-[44px] flex-center"
                        >
                          <Stroke4Step
                            color={strokeStep === 16 ? color : "#BCC2CB"}
                          />
                        </button>
                        <button
                          onClick={() => setStrokeStep(12)}
                          className="pointer-events-auto size-[44px] flex-center"
                        >
                          <Stroke3Step
                            color={strokeStep === 12 ? color : "#BCC2CB"}
                          />
                        </button>
                        <button
                          onClick={() => setStrokeStep(8)}
                          className="pointer-events-auto size-[44px] flex-center"
                        >
                          <Stroke2Step
                            color={strokeStep === 8 ? color : "#BCC2CB"}
                          />
                        </button>
                        <button
                          onClick={() => setStrokeStep(4)}
                          className="pointer-events-auto size-[44px] flex-center"
                        >
                          <Stroke1Step
                            color={strokeStep === 4 ? color : "#BCC2CB"}
                          />
                        </button>
                      </div>
                    )}
                  </button>
                  <div className="w-[1px] h-[40px] bg-[#EEEFF3] mx-[8px]" />
                  <button
                    onClick={() => {
                      setCanDraw(false);
                      setDrawType("zoom");
                    }}
                    className={clsx(
                      "pointer-events-auto size-[44px] rounded-lg flex-center",
                      drawType === "zoom" ? "bg-[#5865FA]" : "#ffffff"
                    )}
                  >
                    <Zoom color={drawType === "zoom" ? "#ffffff" : "#353B45"} />
                  </button>
                  <div className="w-[1px] h-[40px] bg-[#EEEFF3] mx-[8px]" />
                  <button
                    onClick={() => {
                      setCanDraw(false);
                      setIsToolBarOpen(false);
                      setDrawType("pen");
                    }}
                    className="pointer-events-auto size-[44px] flex-center"
                  >
                    <Close />
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
