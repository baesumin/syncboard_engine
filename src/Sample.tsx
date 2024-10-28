import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Thumbnail } from "react-pdf";
import { useResizeDetector } from "react-resize-detector";
import { isBrowser, useMobileOrientation } from "react-device-detect";
import { LineCapStyle, PDFDocument } from "pdf-lib";
import { OnRenderSuccess } from "react-pdf/src/shared/types.js";
import {
  colors,
  colorToRGB,
  drawDashedLine,
  drawSmoothLine,
  DrawType,
  getDrawingPosition,
  nativeLog,
  PathsType,
  postMessage,
} from "./utils";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import FullScreen from "./assets/ico-fullscreen.svg?react";
import ThumbnailList from "./assets/ico-thumb-documnet.svg?react";
import ArrowLeft from "./assets/ico-arrow-left.svg?react";
import Close from "./assets/ico-close.svg?react";
import SamplePdf from "./assets/sample.pdf";
import Sample2Pdf from "./assets/sample.pdf";

const DEVICE_PIXEL_RATIO = 2;
const LINE_WIDTH = 10;

export default function Sample() {
  const { orientation } = useMobileOrientation();
  const { width, height, ref } = useResizeDetector();

  const canvas = useRef<HTMLCanvasElement>(null);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const scale = useRef(1);
  const pathsRef = useRef<PathsType[]>([]);

  const [canDraw, setCanDraw] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [file, setFile] = useState("");
  const [isFileLoad, setIsFileLoad] = useState(false);
  const [color, setColor] = useState<keyof typeof colors>("orange");
  const [pageSize, setPageSize] = useState({
    width: 0,
    height: 0,
  });
  const [paths, setPaths] = useState<{
    [pageNumber: number]: PathsType[];
  }>([]);
  const [drawOrder, setDrawOrder] = useState(0);
  const [isListOpen, setIsListOpen] = useState(false);
  const [totalPage, setTotalPage] = useState(0);

  const startDrawing = (e: DrawType) => {
    e.persist();
    if (!canDraw || !width || !height || !canvas.current) {
      return;
    }
    setIsDrawing(true);

    const context = canvas.current.getContext("2d")!;

    const { x, y } = getDrawingPosition(
      canvas,
      e,
      DEVICE_PIXEL_RATIO,
      scale.current
    );

    if (isEraser) {
      drawDashedLine(context, x, y, x, y);
    } else {
      drawSmoothLine(context, x, y, x, y, color, LINE_WIDTH);
    }

    pathsRef.current.push({
      x: x / pageSize.width,
      y: y / pageSize.height,
      lastX: x / pageSize.width,
      lastY: y / pageSize.height,
      lineWidth: LINE_WIDTH / pageSize.width,
      color,
      drawOrder,
    });
    lastXRef.current = x;
    lastYRef.current = y;
  };

  const draw = (e: DrawType) => {
    e.persist();
    if (!isDrawing || !canvas.current || !width || !height) return;

    const context = canvas.current.getContext("2d")!;

    const { x, y } = getDrawingPosition(
      canvas,
      e,
      DEVICE_PIXEL_RATIO,
      scale.current
    );

    if (isEraser) {
      drawDashedLine(context, lastXRef.current, lastYRef.current, x, y);
    } else {
      drawSmoothLine(
        context,
        lastXRef.current,
        lastYRef.current,
        x,
        y,
        color,
        LINE_WIDTH
      );
    }

    pathsRef.current.push({
      x: x / pageSize.width,
      y: y / pageSize.height,
      lastX: lastXRef.current / pageSize.width,
      lastY: lastYRef.current / pageSize.height,
      lineWidth: LINE_WIDTH / pageSize.width,
      color,
      drawOrder,
    });
    lastXRef.current = x;
    lastYRef.current = y;
  };

  const redrawPaths = useCallback(
    (pageWidth: number, pageHeight: number) => {
      if (canvas.current && width && height) {
        const context = canvas.current.getContext("2d")!;
        const points = paths[pageNumber];
        if (paths[pageNumber]) {
          // 점을 그룹으로 나누기
          let currentGroup: PathsType[] = [];
          for (let i = 1; i < points.length; i++) {
            if (
              i === 0 ||
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
      }
    },
    [height, pageNumber, paths, width]
  );

  const stopDrawing = useCallback(async () => {
    setIsDrawing(false);

    if (isEraser) {
      // 손을 뗄 때 기존 선과 겹치는 부분 삭제
      if (pathsRef.current.length > 0) {
        const currentPaths = paths[pageNumber] || [];
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
            if (distance <= LINE_WIDTH) {
              drawOrdersToDelete.add(path.drawOrder);
            }

            // 선이 지나간 경우도 처리
            const pathLength = Math.sqrt(
              Math.pow(
                path.lastX * pageSize.width - path.x * pageSize.width,
                2
              ) +
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

              if (midDistance <= LINE_WIDTH) {
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
        setPaths((prev) => ({
          ...prev,
          [pageNumber]: newPaths,
        }));

        // pathsRef 초기화
        pathsRef.current = [];
      }
      if (canvas.current) {
        // 점선도 지우기
        const context = canvas.current.getContext("2d")!;
        context.clearRect(0, 0, canvas.current.width, canvas.current.height); // 전체 캔버스 지우기
      }
    }

    if (pathsRef.current.length > 0 && !isEraser) {
      const newValue = pathsRef.current;
      setDrawOrder((prev) => prev + 1);
      setPaths((prev) => {
        return {
          ...prev,
          [pageNumber]: [...(prev[pageNumber] || []), ...newValue],
        };
      });
      // pathsRef 초기화
      pathsRef.current = [];
    }
  }, [isEraser, pageNumber, pageSize, paths]);

  const onRenderSuccess: OnRenderSuccess = (page) => {
    setPageSize({
      width: page.width,
      height: page.height,
    });
  };

  const downloadModifiedPDF = useCallback(async () => {
    // 기존 PDF 로드
    const existingPdfBytes = await fetch(file).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const currentPaths = paths[i + 1]; // 현재 페이지의 경로 가져오기
      if (currentPaths) {
        const page = pdfDoc.getPage(i);
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // 경로 그리기
        currentPaths.forEach(({ x, y, lastX, lastY, color, lineWidth }) => {
          page.drawLine({
            start: {
              x: (lastX * pageWidth) / DEVICE_PIXEL_RATIO,
              y: pageHeight - (lastY * pageHeight) / DEVICE_PIXEL_RATIO,
            }, // y 좌표 반전
            end: {
              x: (x * pageWidth) / DEVICE_PIXEL_RATIO,
              y: pageHeight - (y * pageHeight) / DEVICE_PIXEL_RATIO,
            }, // y 좌표 반전
            color: colorToRGB(color), // 선 색상
            thickness: (lineWidth * pageWidth) / DEVICE_PIXEL_RATIO, // 선 두께
            lineCap: LineCapStyle.Round,
          });
        });
      }
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    nativeLog(`blob size: ${blob.size}`);
    if (isBrowser) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "modified.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const base64DataUri = await pdfDoc.saveAsBase64({ dataUri: true });
      postMessage("save", base64DataUri);
    }
  }, [file, paths]);

  const webViewLitener = useCallback(
    (e: MessageEvent) => {
      const { type, value } = JSON.parse(e.data);
      if (type === "drawing") {
        setCanDraw(value);
      } else if (type === "color") {
        setColor(value);
        setIsEraser(false);
      } else if (type === "eraser") {
        setIsEraser(true);
      } else if (type === "save") {
        downloadModifiedPDF();
      } else if (type === "pdf") {
        if (value) {
          const base64 = (value as string).split(",")[1].slice(0, -1);
          setFile(`data:application/pdf;base64,${base64}`);
        }
        setIsFileLoad(true);
      }
    },
    [downloadModifiedPDF]
  );

  useEffect(() => {
    if (pageSize.width > 0) {
      redrawPaths(pageSize.width, pageSize.height);
    }
  }, [pageSize, redrawPaths]);

  useEffect(() => {
    document.addEventListener("message", webViewLitener as EventListener);
    return () =>
      document.removeEventListener("message", webViewLitener as EventListener);
  }, [webViewLitener]);

  useEffect(() => {
    if (isBrowser) {
      setFile(Sample2Pdf);
      return;
    }
    if (isFileLoad && !file) {
      setFile(SamplePdf);
    }
  }, [file, isFileLoad]);

  const onTransFormed = (_: unknown, state: { scale: number }) => {
    scale.current = state.scale;
  };

  return (
    <>
      <div className="w-dvw h-dvh bg-gray-400 flex justify-center items-center">
        {file && (
          <Document
            file={file}
            onLoadSuccess={(pdf) => {
              setTotalPage(pdf.numPages);
            }}
          >
            <TransformWrapper
              disabled={canDraw}
              initialScale={1}
              maxScale={3}
              minScale={1}
              disablePadding
              onTransformed={onTransFormed}
            >
              <TransformComponent>
                <div
                  ref={ref}
                  className="w-dvw h-dvh flex justify-center items-center"
                >
                  {file && (
                    <>
                      <Thumbnail
                        pageNumber={pageNumber}
                        width={orientation === "portrait" ? width : undefined}
                        height={height}
                        devicePixelRatio={DEVICE_PIXEL_RATIO * scale.current}
                        onRenderSuccess={onRenderSuccess}
                      />
                      <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center">
                        <canvas
                          ref={canvas}
                          key={pageNumber}
                          width={pageSize.width * DEVICE_PIXEL_RATIO}
                          height={pageSize.height * DEVICE_PIXEL_RATIO}
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
                  )}
                </div>
              </TransformComponent>
            </TransformWrapper>
            {isListOpen && (
              <div className="absolute top-0 left-0 bottom-0 right-0 overflow-auto bg-black/70 px-5 py-5">
                <div className="h-16 flex justify-end items-center">
                  <button
                    onClick={() => setIsListOpen(false)}
                    className="bg-white size-[48px] flex justify-center items-center rounded-lg"
                  >
                    <Close />
                  </button>
                </div>
                <div className="flex gap-4 flex-wrap">
                  {[...new Array(totalPage)].map((_, index) => {
                    return (
                      <div key={index} className="w-[180px]">
                        <Thumbnail
                          pageNumber={index + 1}
                          width={180}
                          devicePixelRatio={2}
                          onItemClick={({ pageNumber }) => {
                            setPageNumber(pageNumber);
                            setIsListOpen(false);
                          }}
                        />
                        <div className="h-[31px] flex justify-center">
                          <span className="text-white">
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
          <div className="fixed left-0 right-0 top-0 bottom-0 flex justify-between items-center pointer-events-none">
            <button
              onClick={() => {
                if (pageNumber !== 1) {
                  setPageNumber((prev) => prev - 1);
                }
              }}
              className="pointer-events-auto w-[80px] h-[160px] rounded-tr-[100px] rounded-br-[100px] bg-[#56657E] opacity-50 flex justify-center items-center text-white"
            >
              <ArrowLeft />
            </button>
            <button
              onClick={() => {
                if (pageNumber !== totalPage) {
                  setPageNumber((prev) => prev + 1);
                }
              }}
              className="pointer-events-auto w-[80px] h-[160px] rounded-tl-[100px] rounded-bl-[100px] bg-[#56657E]/50 flex justify-center items-center text-white"
            >
              <div className="rotate-180">
                <ArrowLeft />
              </div>
            </button>
          </div>
          <div className="fixed left-0 right-0 top-0 flex justify-between px-[30px] pt-[30px] pointer-events-none">
            <button
              onClick={() => setIsListOpen(true)}
              className="pointer-events-auto w-[113px] h-[52px] rounded-xl bg-[#202325]/70 flex items-center pl-1 gap-3"
            >
              <div className="size-[44px] bg-white rounded-lg flex justify-center items-center">
                <ThumbnailList />
              </div>
              <span className="text-white text-lg">{`${pageNumber}/${totalPage}`}</span>
            </button>
            <button
              onClick={() => postMessage("fullScreen")}
              className="pointer-events-auto size-[52px] rounded-xl bg-white shadow-black shadow-sm flex justify-center items-center"
            >
              <FullScreen />
            </button>
          </div>
        </>
      )}
    </>
  );
}
