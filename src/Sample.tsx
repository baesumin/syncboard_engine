import { useCallback, useEffect, useRef, useState } from "react";
import { Document, pdfjs, Thumbnail } from "react-pdf";
import { useResizeDetector } from "react-resize-detector";
import { isBrowser, useMobileOrientation } from "react-device-detect";
import { LineCapStyle, PDFDocument } from "pdf-lib";
import { OnRenderSuccess } from "react-pdf/src/shared/types.js";
import {
  colorMap,
  colorToRGB,
  drawDashedLine,
  drawHighlightLine,
  drawSmoothLine,
  DrawType,
  getDrawingPosition,
  nativeLog,
  PathsType,
  postMessage,
} from "./utils";
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

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

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

  const canvas = useRef<HTMLCanvasElement>(null);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const scale = useRef(1);
  const pathsRef = useRef<PathsType[]>([]);
  const scaleRef = useRef<ReactZoomPanPinchContentRef>(null);

  const [canDraw, setCanDraw] = useState(false);
  const [isToolBarOpen, setIsToolBarOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [renderedPageNumber, setRenderedPageNumber] = useState<number>(0);
  const [file, setFile] = useState("");
  const [color, setColor] = useState<(typeof colorMap)[number]>("#F34A47");
  const [pageSize, setPageSize] = useState({
    width: 0,
    height: 0,
  });
  const paths = useRef<{
    [pageNumber: number]: PathsType[];
  }>({});
  const [drawOrder, setDrawOrder] = useState(0);
  const [isListOpen, setIsListOpen] = useState(false);
  const [totalPage, setTotalPage] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [drawType, setDrawType] = useState<
    "pen" | "highlight" | "eraser" | "zoom"
  >("pen");
  const [strokeStep, setStrokeStep] = useState(12);
  const [devicePixelRatio] = useState(2);
  const [isStrokeOpen, setIsStrokeOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const isLoading = renderedPageNumber !== pageNumber;

  const startDrawing = (e: DrawType) => {
    e.persist();

    if (!canDraw || !width || !height || !canvas.current) {
      return;
    }

    const context = canvas.current.getContext("2d")!;
    context.beginPath();
    const { x, y } = getDrawingPosition(
      canvas,
      e,
      devicePixelRatio,
      scale.current
    );

    if (drawType === "eraser") {
      drawDashedLine(context, x, y, x, y);
    } else if (drawType === "highlight") {
      drawHighlightLine(context, x, y, x, y, color, strokeStep);
    } else {
      drawSmoothLine(context, x, y, x, y, color, strokeStep);
    }

    pathsRef.current.push({
      x: x / pageSize.width,
      y: y / pageSize.height,
      lastX: x / pageSize.width,
      lastY: y / pageSize.height,
      lineWidth: strokeStep / pageSize.width,
      color,
      drawOrder,
    });
    lastXRef.current = x;
    lastYRef.current = y;
  };

  const draw = (e: DrawType) => {
    e.persist();
    if (!canvas.current || !width || !height) return;

    const context = canvas.current.getContext("2d")!;

    const { x, y } = getDrawingPosition(
      canvas,
      e,
      devicePixelRatio,
      scale.current
    );

    // 이전 점과의 거리 계산
    const distance = Math.sqrt(
      Math.pow(x - lastXRef.current, 2) + Math.pow(y - lastYRef.current, 2)
    );
    const DISTANCE_THRESHOLD = 0;

    // 설정된 간격 이상일 때만 그리기
    if (distance >= DISTANCE_THRESHOLD) {
      if (drawType === "eraser") {
        drawDashedLine(context, lastXRef.current, lastYRef.current, x, y);
      } else if (drawType === "highlight") {
        drawHighlightLine(
          context,
          lastXRef.current,
          lastYRef.current,
          x,
          y,
          color,
          strokeStep
        );
      } else {
        drawSmoothLine(
          context,
          lastXRef.current,
          lastYRef.current,
          x,
          y,
          color,
          strokeStep
        );
      }
      pathsRef.current.push({
        x: x / pageSize.width,
        y: y / pageSize.height,
        lastX: lastXRef.current / pageSize.width,
        lastY: lastYRef.current / pageSize.height,
        lineWidth: strokeStep / pageSize.width,
        color,
        drawOrder,
      });
      lastXRef.current = x;
      lastYRef.current = y;
    }
  };

  const redrawPaths = useCallback(
    (pageWidth: number, pageHeight: number) => {
      if (canvas.current && width && height) {
        const context = canvas.current.getContext("2d")!;
        context.beginPath();
        const points = paths.current[pageNumber];
        if (points) {
          // 점을 그룹으로 나누기
          let currentGroup: PathsType[] = [];

          for (let i = 1; i < points.length; i++) {
            // 단일 점 처리
            // if (
            //   points[i].lastX !== points[i - 1].x ||
            //   points[i].lastY !== points[i - 1].y
            // ) {
            //   drawSmoothLine(
            //     context,
            //     points[i].x * pageWidth,
            //     points[i].y * pageHeight,
            //     points[i].x * pageWidth,
            //     points[i].y * pageHeight,
            //     points[i].color,
            //     points[i].lineWidth * pageWidth
            //   );
            //   continue;
            // }

            if (
              points[i].lastX !== points[i - 1].x ||
              points[i].lastY !== points[i - 1].y
            ) {
              // 선이 띄워진 경우
              // 새로운 그룹 시작
              if (currentGroup.length > 1) {
                // 현재 그룹이 2개 이상의 점을 포함하면 선 그리기
                for (let j = 1; j < currentGroup.length; j++) {
                  drawSmoothLine(
                    context,
                    currentGroup[j - 1].x * pageWidth,
                    currentGroup[j - 1].y * pageHeight,
                    currentGroup[j].x * pageWidth,
                    currentGroup[j].y * pageHeight,
                    currentGroup[j].color,
                    currentGroup[j].lineWidth * pageWidth
                  );
                }
              }

              currentGroup = [points[i]]; // 새로운 그룹 초기화
            } else {
              if (i === 1) {
                drawSmoothLine(
                  context,
                  points[0].x * pageWidth,
                  points[0].y * pageHeight,
                  points[1].x * pageWidth,
                  points[1].y * pageHeight,
                  points[1].color,
                  points[1].lineWidth * pageWidth
                );
              }
              // 선이 이어진 경우
              currentGroup.push(points[i]); // 현재 그룹에 점 추가
            }
          }
          // 마지막 그룹 처리
          if (currentGroup.length > 1) {
            for (let j = 1; j < currentGroup.length; j++) {
              drawSmoothLine(
                context,
                currentGroup[j - 1].x * pageWidth,
                currentGroup[j - 1].y * pageHeight,
                currentGroup[j].x * pageWidth,
                currentGroup[j].y * pageHeight,
                currentGroup[j].color,
                currentGroup[j].lineWidth * pageWidth
              );
            }
          }
        }
        context.closePath();
        setIsRendering(false);
      }
    },
    [height, pageNumber, paths, width]
  );

  const stopDrawing = async () => {
    if (
      drawType === "eraser" &&
      pathsRef.current.length > 0 &&
      canvas.current
    ) {
      const currentPaths = paths.current[pageNumber] || [];
      const erasePaths = pathsRef.current;

      // 지우기 모드에서 겹치는 drawOrder를 찾기
      const drawOrdersToDelete = new Set();

      // 모든 erasePath에 대해 반복
      erasePaths.forEach((erasePath) => {
        const eraseX = erasePath.x * pageSize.width;
        const eraseY = erasePath.y * pageSize.height;

        // currentPaths를 반복하여 겹치는 경로를 찾기
        currentPaths.forEach((path) => {
          const distance = Math.sqrt(
            Math.pow(path.x * pageSize.width - eraseX, 2) +
              Math.pow(path.y * pageSize.height - eraseY, 2)
          );

          // 겹치는 경로가 있으면 drawOrder를 추가
          if (distance <= strokeStep) {
            drawOrdersToDelete.add(path.drawOrder);
          }

          // 선이 지나간 경우도 처리
          const pathLength = Math.sqrt(
            Math.pow(path.lastX * pageSize.width - path.x * pageSize.width, 2) +
              Math.pow(
                path.lastY * pageSize.height - path.y * pageSize.height,
                2
              )
          );

          // 선의 중간 점들에 대해 거리 체크
          for (let i = 0; i <= pathLength; i += 1) {
            const t = i / pathLength;
            const midX =
              (1 - t) * (path.x * pageSize.width) +
              t * (path.lastX * pageSize.width);
            const midY =
              (1 - t) * (path.y * pageSize.height) +
              t * (path.lastY * pageSize.height);
            const midDistance = Math.sqrt(
              Math.pow(midX - eraseX, 2) + Math.pow(midY - eraseY, 2)
            );

            if (midDistance <= strokeStep) {
              drawOrdersToDelete.add(path.drawOrder);
              break; // 한 번이라도 겹치면 더 이상 체크할 필요 없음
            }
          }
        });
      });
      // drawOrder가 포함되지 않은 경로만 남기기
      const newPaths = currentPaths.filter((path) => {
        return !drawOrdersToDelete.has(path.drawOrder);
      });

      // paths 업데이트
      paths.current = {
        ...paths.current,
        [pageNumber]: newPaths,
      };

      // pathsRef 초기화
      pathsRef.current = [];
      // 점선도 지우기
      const context = canvas.current.getContext("2d")!;
      context.closePath();
      context.clearRect(0, 0, canvas.current.width, canvas.current.height); // 전체 캔버스 지우기
      redrawPaths(pageSize.width, pageSize.height);
    }

    if (pathsRef.current.length > 0 && drawType !== "eraser") {
      const context = canvas.current!.getContext("2d")!;
      context.closePath();
      const newValue = pathsRef.current;
      setDrawOrder((prev) => prev + 1);
      paths.current = {
        ...paths.current,
        [pageNumber]: [...(paths.current[pageNumber] || []), ...newValue],
      };
      // pathsRef 초기화
      pathsRef.current = [];
    }
  };

  const onRenderSuccess: OnRenderSuccess = (page) => {
    setRenderedPageNumber(pageNumber);
    setIsRendering(true);
    setPageSize({
      width: page.width,
      height: page.height,
    });
  };

  const getModifiedPDFBase64 = useCallback(async () => {
    // 기존 PDF 로드
    const existingPdfBytes = file;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const currentPaths = paths.current[i + 1]; // 현재 페이지의 경로 가져오기
      if (currentPaths) {
        const page = pdfDoc.getPage(i);
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // 경로 그리기
        currentPaths.forEach(({ x, y, lastX, lastY, color, lineWidth }) => {
          page.drawLine({
            start: {
              x: (lastX * pageWidth) / devicePixelRatio,
              y: pageHeight - (lastY * pageHeight) / devicePixelRatio,
            }, // y 좌표 반전
            end: {
              x: (x * pageWidth) / devicePixelRatio,
              y: pageHeight - (y * pageHeight) / devicePixelRatio,
            }, // y 좌표 반전
            color: colorToRGB(color), // 선 색상
            thickness: (lineWidth * pageWidth) / devicePixelRatio, // 선 두께
            lineCap: LineCapStyle.Round,
          });
        });
      }
    }
    const pdfBytes = await pdfDoc.save();
    if (isBrowser) {
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      nativeLog(`blob size: ${blob.size}`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "modified.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    const base64DataUri = await pdfDoc.saveAsBase64();
    return base64DataUri;
  }, [devicePixelRatio, file]);

  useEffect(() => {
    if (isRendering) {
      redrawPaths(pageSize.width, pageSize.height);
    }
  }, [isRendering, pageSize, redrawPaths]);

  useEffect(() => {
    if (isBrowser || import.meta.env.MODE === "development") {
      setFile(base64);
    }
  }, []);

  useEffect(() => {
    if (!isBrowser) {
      (window as unknown as window).webviewApi = (data: string) => {
        const param = JSON.parse(data);
        setFile(param?.data?.base64);
      };
      (window as unknown as window).getBase64 = async () => {
        const data = await getModifiedPDFBase64();
        (window as unknown as window).AndroidInterface.getBase64(data);
      };
    }
  }, [getModifiedPDFBase64]);

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
                      <Thumbnail
                        key={renderedPageNumber}
                        pageNumber={renderedPageNumber}
                        width={orientation === "portrait" ? width : undefined}
                        height={height}
                        devicePixelRatio={devicePixelRatio}
                        loading={<></>}
                        noData={<></>}
                      />
                    )}
                    <Thumbnail
                      key={pageNumber}
                      className={isLoading ? "hidden" : ""}
                      pageNumber={pageNumber}
                      width={orientation === "portrait" ? width : undefined}
                      height={height}
                      devicePixelRatio={devicePixelRatio}
                      onRenderSuccess={onRenderSuccess}
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
              {(!isToolBarOpen || isBrowser) && (
                <button
                  onClick={async () => {
                    await getModifiedPDFBase64();
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
