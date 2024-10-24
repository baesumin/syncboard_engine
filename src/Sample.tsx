import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { useResizeDetector } from "react-resize-detector";
import { isBrowser, useMobileOrientation } from "react-device-detect";
import { LineCapStyle, PDFDocument, rgb } from "pdf-lib";

// import MyPdf from "./assets/sample.pdf";
import { OnPageLoadSuccess } from "react-pdf/src/shared/types.js";
import {
  DrawSmoothLine,
  DrawType,
  GetClientPosition,
  NativeLog,
  PathsType,
  PostMessage,
} from "./utils";

const DEVICE_PIXEL_RATIO = 2;
const LINE_WIDTH = 10;

export default function Sample() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [canDraw, setCanDraw] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState({
    width: 0,
    height: 0,
  });

  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const pathsRef = useRef<PathsType[]>([]);
  const [file, setFile] = useState("");
  const [isFileLoad, setIsFileLoad] = useState(false);

  const [paths, setPaths] = useState<{
    [pageNumber: number]: PathsType[];
  }>([]);

  const { width, height, ref } = useResizeDetector();
  const [color, setColor] = useState("orange");
  const { orientation } = useMobileOrientation();
  const pageWidth = useMemo(
    () => (orientation === "portrait" ? width : undefined),
    [orientation, width]
  );

  const startDrawing = (e: DrawType) => {
    e.persist();
    if (!canDraw || !width || !height || !canvas.current) {
      return;
    }
    setIsDrawing(true);

    const context = canvas.current.getContext("2d")!;
    const rect = canvas.current.getBoundingClientRect();
    const clientX = GetClientPosition(e, DEVICE_PIXEL_RATIO, "x");
    const clientY = GetClientPosition(e, DEVICE_PIXEL_RATIO, "y");
    const x = clientX - DEVICE_PIXEL_RATIO * rect.left;
    const y = clientY - DEVICE_PIXEL_RATIO * rect.top;

    DrawSmoothLine(context, x, y, x, y, color, LINE_WIDTH, isEraser);

    pathsRef.current.push({
      x: x / pageSize.width,
      y: y / pageSize.height,
      lastX: x / pageSize.width,
      lastY: y / pageSize.height,
      lineWidth: LINE_WIDTH / pageSize.width,
    });
    lastXRef.current = x;
    lastYRef.current = y;
  };

  const draw = (e: DrawType) => {
    e.persist();
    if (!isDrawing || !canvas.current || !width || !height) return;

    const context = canvas.current.getContext("2d")!;

    const rect = canvas.current.getBoundingClientRect();
    const clientX = GetClientPosition(e, DEVICE_PIXEL_RATIO, "x");
    const clientY = GetClientPosition(e, DEVICE_PIXEL_RATIO, "y");
    const x = clientX - DEVICE_PIXEL_RATIO * rect.left;
    const y = clientY - DEVICE_PIXEL_RATIO * rect.top;

    DrawSmoothLine(
      context,
      lastXRef.current,
      lastYRef.current,
      x,
      y,
      color,
      LINE_WIDTH,
      isEraser
    );

    pathsRef.current.push({
      x: x / pageSize.width,
      y: y / pageSize.height,
      lastX: lastXRef.current / pageSize.width,
      lastY: lastYRef.current / pageSize.height,
      lineWidth: LINE_WIDTH / pageSize.width,
    });
    lastXRef.current = x;
    lastYRef.current = y;
  };

  const redrawPaths = useCallback(() => {
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
                DrawSmoothLine(
                  context,
                  currentGroup[j - 1].x * pageSize.width,
                  currentGroup[j - 1].y * pageSize.height,
                  currentGroup[j].x * pageSize.width,
                  currentGroup[j].y * pageSize.height,
                  color,
                  currentGroup[j].lineWidth * pageSize.width
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
            DrawSmoothLine(
              context,
              currentGroup[j - 1].x * pageSize.width,
              currentGroup[j - 1].y * pageSize.height,
              currentGroup[j].x * pageSize.width,
              currentGroup[j].y * pageSize.height,
              color,
              currentGroup[j].lineWidth * pageSize.width
            );
          }
        }
      }
      setIsRendered(false);
    }
  }, [color, height, pageNumber, pageSize, paths, width]);

  const stopDrawing = async () => {
    setIsDrawing(false);
    if (isEraser && canvas.current) {
    }
    if (pathsRef.current.length > 0 && !isEraser) {
      const newValue = pathsRef.current;
      setPaths((prev) => {
        return {
          ...prev,
          [pageNumber]: [...(prev[pageNumber] || []), ...newValue],
        };
      });
      // pathsRef 초기화
      pathsRef.current = [];
    }
  };

  const onRenderSuccess = () => {
    setIsRendered(true);
  };

  const onLoadSuccess: OnPageLoadSuccess = (page) => {
    if (!width || !height) {
      return;
    }
    setPageSize({
      width: page.width,
      height: page.height,
    });
  };

  useEffect(() => {
    if (isRendered) {
      redrawPaths();
    }
  }, [isRendered, redrawPaths]);

  const downloadModifiedPDF = useCallback(async () => {
    // 기존 PDF 로드
    const existingPdfBytes = await fetch(file).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const currentPaths = paths[i + 1]; // 현재 페이지의 경로 가져오기
      if (currentPaths) {
        const page = pdfDoc.getPage(i);
        const { width: pageWidth, height: pageHeight } = page.getSize();
        NativeLog(`${pageWidth} ${pageHeight}`);

        // 경로 그리기
        currentPaths.forEach(({ x, y, lastX, lastY, lineWidth }) => {
          page.drawLine({
            start: {
              x: (lastX * pageWidth) / DEVICE_PIXEL_RATIO,
              y: pageHeight - (lastY * pageHeight) / DEVICE_PIXEL_RATIO,
            }, // y 좌표 반전
            end: {
              x: (x * pageWidth) / DEVICE_PIXEL_RATIO,
              y: pageHeight - (y * pageHeight) / DEVICE_PIXEL_RATIO,
            }, // y 좌표 반전
            color: rgb(0, 0, 0), // 선 색상
            thickness: (lineWidth * pageWidth) / DEVICE_PIXEL_RATIO, // 선 두께
            lineCap: LineCapStyle.Round,
          });
        });
      }
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    NativeLog(`blob size: ${blob.size}`);
    if (isBrowser) {
      // PDF 다운로드
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "modified.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const base64DataUri = await pdfDoc.saveAsBase64({ dataUri: true });
      PostMessage("save", base64DataUri);
    }
  }, [file, paths]);

  const webViewLitener = useCallback(
    (e: MessageEvent) => {
      const { type, value } = JSON.parse(e.data);
      if (type === "drawing") {
        setCanDraw(value);
      } else if (type === "left") {
        if (pageNumber !== 1) {
          setPageNumber((prev) => prev - 1);
        }
      } else if (type === "right") {
        setPageNumber((prev) => prev + 1);
      } else if (type === "color") {
        setColor(value);
        setIsEraser(false);
      } else if (type === "refresh") {
        redrawPaths();
      } else if (type === "eraser") {
        setIsEraser(true);
      } else if (type === "save") {
        downloadModifiedPDF();
      } else if (type === "pdf") {
        if (value) {
          NativeLog((value as string).substring(0, 100));
          const base64 = (value as string).split(",")[1].slice(0, -1);
          setFile(`data:application/pdf;base64,${base64}`);
        }
        setIsFileLoad(true);
      }
    },
    [downloadModifiedPDF, pageNumber, redrawPaths]
  );

  useEffect(() => {
    document.addEventListener("message", webViewLitener as EventListener);
    return () =>
      document.removeEventListener("message", webViewLitener as EventListener);
  }, [webViewLitener]);

  useEffect(() => {
    if (isBrowser) {
      setFile("/src/assets/sample.pdf");
      return;
    }
    if (isFileLoad && !file) {
      setFile("/src/assets/sample.pdf");
    }
  }, [file, isFileLoad]);

  return (
    <>
      <div
        ref={ref}
        className="w-dvw h-dvh bg-gray-400 flex justify-center items-center"
      >
        {file && (
          <Document file={file}>
            <Page
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchCancel={stopDrawing}
              onTouchEnd={stopDrawing}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              onRenderAnnotationLayerSuccess={() => {
                NativeLog("onRenderAnnotationLayerSuccess");
              }}
              onRenderAnnotationLayerError={() => {
                NativeLog("onRenderAnnotationLayerError");
              }}
              pageNumber={pageNumber}
              canvasRef={canvas}
              width={pageWidth}
              height={height}
              devicePixelRatio={DEVICE_PIXEL_RATIO}
              onLoadSuccess={onLoadSuccess}
              onRenderSuccess={onRenderSuccess}
            />
          </Document>
        )}
      </div>
    </>
  );
}
