import { useEffect, useRef, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import MyPdf from "./assets/sample.pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function Sample() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [canDraw, setCanDraw] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [paths, setPaths] = useState<
    Array<{ x: number; y: number; lastX: number; lastY: number }>
  >([]);

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
        e.nativeEvent instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
      setLastX(clientX - rect.left);
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
      e.nativeEvent instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (context) {
      context.beginPath();
      context.moveTo(lastX, lastY);
      context.lineTo(x, y);
      context.strokeStyle = "red"; // 원하는 색상으로 변경 가능
      context.lineWidth = 2; // 원하는 두께로 변경 가능
      context.stroke();
      context.closePath();
    }

    setLastX(x);
    setLastY(y);
    setPaths((prev) => [...prev, { x, y, lastX: x, lastY: y }]);
  };
  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const redrawPaths = () => {
    if (canvas.current) {
      const context = canvas.current.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.current.width, canvas.current.height); // 기존 내용을 지움
        context.beginPath();
        paths.forEach(({ x, y, lastX, lastY }) => {
          //   console.log({ x, y, lastX, lastY });
          context.moveTo(lastX, lastY);
          context.lineTo(x, y);
          context.strokeStyle = "red"; // 원하는 색상으로 변경 가능
          context.lineWidth = 2; // 원하는 두께로 변경 가능
          context.stroke();
        });
        context.closePath();
      }
    }
  };

  useEffect(() => {
    redrawPaths();
  }, [pageNumber]);

  return (
    <div
      className="flex w-full h-screen justify-center items-center bg-gray-500"
      draggable={false}
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
        />
      </Document>
      <button className="fixed" onClick={() => setCanDraw((prev) => !prev)}>
        {canDraw ? "안그리기" : "그리기"}
      </button>
      {/* <button onClick={() => setPageNumber((prev) => prev - 1)}>
        이전페이지
      </button>
      <button onClick={() => setPageNumber((prev) => prev + 1)}>
        다음페이지
      </button> */}
    </div>
  );
}
