import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import { useResizeDetector } from "react-resize-detector";
import { useMobileOrientation } from "react-device-detect";
import { PDFDocument } from "pdf-lib";

import MyPdf from "./assets/sample.pdf";
import { OnPageLoadSuccess } from "react-pdf/src/shared/types.js";
import {
  DrawSmoothLine,
  GetClientPosition,
  NativeLog,
  PathsType,
  PostMessage,
} from "./utils";

const DEVICE_PIXEL_RATIO = 1;
const DOWNLOAD_SCALE = 2;
const LINE_WIDTH = 10;

type DrawType = React.PointerEvent<HTMLCanvasElement> &
  React.TouchEvent<HTMLCanvasElement>;

export default function Sample() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [canDraw, setCanDraw] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isHeightBig, setIsHeightBig] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const pathsRef = useRef<PathsType[]>([]);

  const [paths, setPaths] = useState<{
    [pageNumber: number]: PathsType[];
  }>([]);

  const { width, height, ref } = useResizeDetector();
  const [ratio, setRatio] = useState(0);
  const [color, setColor] = useState("orange");
  const [baseWidth, setBaseWidth] = useState({
    orientation: "",
    width: 0,
  });
  const [currentWidth, setCurrentWidth] = useState({
    orientation: "",
    width: 966,
  });
  const { orientation } = useMobileOrientation();
  const pageWidth = useMemo(
    () => (orientation === "portrait" && !isHeightBig ? width : undefined),
    [isHeightBig, orientation, width]
  );
  const ratio2 = currentWidth.width / baseWidth.width;
  const adjustCoordinates = (x: number) => {
    return {
      adjustedX: x * ratio2,
    };
  };

  const startDrawing = (e: DrawType) => {
    e.persist();
    if (!canDraw || !width || !height || !canvas.current) {
      return;
    }
    setIsDrawing(true);

    const context = canvas.current.getContext("2d")!;
    // context.globalCompositeOperation = "destination-out";

    const rect = canvas.current.getBoundingClientRect();
    const clientX = GetClientPosition(e, DEVICE_PIXEL_RATIO, "x");
    const clientY = GetClientPosition(e, DEVICE_PIXEL_RATIO, "y");
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    DrawSmoothLine(context, x, y, x, y, color, LINE_WIDTH, isEraser);

    pathsRef.current.push({
      x,
      y,
      lastX: x,
      lastY: y,
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
    const x = clientX - rect.left;
    const y = clientY - rect.top;

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
      x,
      y,
      lastX: lastXRef.current,
      lastY: lastYRef.current,
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
                  currentGroup[j - 1].x,
                  currentGroup[j - 1].y,
                  currentGroup[j].x,
                  currentGroup[j].y,
                  color,
                  LINE_WIDTH
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
              currentGroup[j - 1].x,
              currentGroup[j - 1].y,
              currentGroup[j].x,
              currentGroup[j].y,
              color,
              LINE_WIDTH
            );
          }
        }
      }
      setIsRendered(false);
    }
  }, [color, height, pageNumber, paths, width]);

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
    if (baseWidth.width === 0) {
      setBaseWidth({
        orientation,
        width: Math.round(page.width),
      });
    }
    if (
      baseWidth.width !== 0 &&
      baseWidth.orientation !== orientation &&
      currentWidth.width === 0
    ) {
      setCurrentWidth({
        orientation,
        width: Math.round(page.width),
      });
    }

    if (ratio === 0) {
      setRatio(width / height);
    }
    if (height && page.height > height) {
      setIsHeightBig(true);
    }
    // PostMessage(
    //   "change",
    //   `${Math.round(page.originalWidth)} ${Math.round(
    //     page.originalHeight
    //   )} ${width} ${height}`
    // );
  };

  useEffect(() => {
    if (isRendered) {
      redrawPaths();
    }
  }, [isRendered, redrawPaths]);

  const downloadModifiedPDF = async () => {
    // 기존 PDF 로드
    const existingPdfBytes = await fetch(MyPdf).then((res) =>
      res.arrayBuffer()
    );
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      if (paths[i + 1]) {
        const page = pdfDoc.getPage(i);
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const tempCanvas = document.createElement("canvas");
        const context = tempCanvas.getContext("2d")!;

        // 캔버스 크기 설정
        tempCanvas.width = pageWidth * DOWNLOAD_SCALE;
        tempCanvas.height = pageHeight * DOWNLOAD_SCALE;
        // PDF 페이지를 새 캔버스에 그리기
        await new Promise((resolve) => {
          const renderTask = pdfjs.getDocument(MyPdf).promise.then((pdf) => {
            return pdf.getPage(i + 1).then((pdfPage) => {
              const viewport = pdfPage.getViewport({ scale: DOWNLOAD_SCALE });
              const renderContext = {
                canvasContext: context,
                viewport: viewport,
              };
              return pdfPage.render(renderContext).promise;
            });
          });
          renderTask.then(resolve);
        });

        paths[i + 1].forEach(({ x, y, lastX, lastY }) => {
          DrawSmoothLine(context, lastX, lastY, x, y, color, LINE_WIDTH);
        });

        const imgData = tempCanvas.toDataURL("image/png");
        const imgBytes = await fetch(imgData).then((res) => res.arrayBuffer());
        const pngImage = await pdfDoc.embedPng(imgBytes);
        pdfDoc.removePage(i);
        const blankPage = pdfDoc.insertPage(i);
        // 이미지 위치 설정
        blankPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      }
    }
    // 수정된 PDF 다운로드
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modified.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      }
    },
    [pageNumber, redrawPaths]
  );

  useEffect(() => {
    document.addEventListener("message", webViewLitener as EventListener);
    return () =>
      document.removeEventListener("message", webViewLitener as EventListener);
  }, [webViewLitener]);

  return (
    <>
      <div
        ref={ref}
        className="w-dvw h-full bg-gray-400 flex justify-center items-center"
      >
        <Document file={MyPdf}>
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
            pageNumber={pageNumber}
            canvasRef={canvas}
            width={pageWidth}
            height={height}
            devicePixelRatio={DEVICE_PIXEL_RATIO}
            onLoadSuccess={onLoadSuccess}
            onRenderSuccess={onRenderSuccess}
          />
        </Document>
        <span className="absolute text-[30px]">{`width: ${width} height: ${height}`}</span>
      </div>
    </>
  );
}
