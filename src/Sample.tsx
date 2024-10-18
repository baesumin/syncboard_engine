import { useEffect, useRef, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
// import "react-pdf/dist/esm/Page/AnnotationLayer.css";
// import "react-pdf/dist/esm/Page/TextLayer.css";

import MyPdf from "./assets/sample.pdf";
import { useResizeDetector } from "react-resize-detector";
import { useMobileOrientation } from "react-device-detect";
import { PDFDocument } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const DEVICE_PIXEL_RATIO = 2;
const DOWNLOAD_SCALE = 2; // 원하는 해상도 스케일

export default function Sample() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [canDraw, setCanDraw] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [paths, setPaths] = useState<{
    [pageNumber: number]: {
      x: number;
      y: number;
      lastX: number;
      lastY: number;
    }[];
  }>([]);
  const { width, height, ref } = useResizeDetector();
  const [isHorizontal, setIsHorizontal] = useState(false);
  const { orientation } = useMobileOrientation();

  const startDrawing = (e: React.SyntheticEvent) => {
    e.persist();
    if (!canDraw) {
      return;
    }
    setIsDrawing(true);
    const rect = canvas.current?.getBoundingClientRect();
    if (rect) {
      const clientX =
        e.nativeEvent instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const clientY =
        (e.nativeEvent instanceof MouseEvent
          ? e.clientY
          : e.touches[0].clientY) * DEVICE_PIXEL_RATIO;
      setLastX((clientX - rect.left) * DEVICE_PIXEL_RATIO);
      setLastY(clientY - rect.top);
    }
  };

  const draw = (e: React.SyntheticEvent) => {
    e.persist();
    if (!isDrawing || !canvas.current) return;

    const context = canvas.current.getContext("2d");

    const rect = canvas.current.getBoundingClientRect();
    const clientX =
      e.nativeEvent instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const clientY =
      (e.nativeEvent instanceof MouseEvent ? e.clientY : e.touches[0].clientY) *
      DEVICE_PIXEL_RATIO;

    const x = (clientX - rect.left) * DEVICE_PIXEL_RATIO;
    const y = clientY - rect.top;

    if (context) {
      context.beginPath();
      context.moveTo(lastX, lastY);
      context.lineTo(x, y);
      context.strokeStyle = "rgba(0,0,0,0.3)"; // 원하는 색상으로 변경 가능
      context.lineWidth = 20; // 원하는 두께로 변경 가능
      context.stroke();
      context.closePath();
    }

    setLastX(x);
    setLastY(y);
    setPaths((prev) => {
      return {
        ...prev,
        [pageNumber]: [...(prev[pageNumber] || []), { x, y, lastX, lastY }],
      };
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const redrawPaths = () => {
    if (canvas.current) {
      const context = canvas.current.getContext("2d");
      if (context) {
        if (paths[pageNumber]) {
          paths[pageNumber].forEach(({ x, y, lastX, lastY }) => {
            context.beginPath();
            context.moveTo(lastX, lastY);
            context.lineTo(x, y);
            context.strokeStyle = "rgba(0,0,0,0.3)"; // 원하는 색상으로 변경 가능
            context.lineWidth = 20; // 원하는 두께로 변경 가능
            context.stroke();
            context.closePath();
          });
        }
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      redrawPaths();
    }, 50);

    return () => clearTimeout(timer);
  }, [pageNumber, isHorizontal]);

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
          context.beginPath();
          context.moveTo(lastX, lastY);
          context.lineTo(x, y);
          context.strokeStyle = "rgba(0,0,0,0.3)"; // 원하는 색상으로 변경 가능
          context.lineWidth = 20; // 원하는 두께로 변경 가능
          context.stroke();
          context.closePath();
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
    // return;
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
  console.log(width, canvas.current?.width);
  return (
    <>
      <div ref={ref} className="h-full">
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
            // width={width}
            height={height}
            devicePixelRatio={DEVICE_PIXEL_RATIO}
          />
        </Document>
      </div>
      <div className="absolute bottom-20 flex justify-between w-full h-[200px]">
        <button
          className="text-[40px]"
          onClick={() => {
            if (pageNumber !== 1) {
              setPageNumber((prev) => prev - 1);
            }
          }}
        >
          이전페이지
        </button>
        <button
          className="text-[40px] text-pink-400"
          onClick={() => setCanDraw((prev) => !prev)}
        >
          {canDraw ? "안그리기" : "그리기"}
        </button>
        <button
          className="text-[40px]"
          onClick={() => {
            setPageNumber((prev) => prev + 1);
          }}
        >
          다음페이지
        </button>
        <button
          className="text-[40px]"
          onClick={() => {
            downloadModifiedPDF();
          }}
        >
          다운로드
        </button>
      </div>
    </>
  );
}
