import { Dispatch, SetStateAction, useCallback, useRef, useState } from "react";
import {
  colorMap,
  drawDashedLine,
  drawSmoothLine,
  getDrawingPosition,
} from "../utils/common";
import {
  canvasEventType,
  DrawType,
  PathsType,
  TouchType,
} from "../types/common";

interface Props {
  devicePixelRatio: number;
  pageSize: {
    width: number;
    height: number;
  };
  strokeStep: number;
  pageNumber: number;
  isRendering: boolean;
  setIsRendering: Dispatch<SetStateAction<boolean>>;
}

export default function useCanvas({
  devicePixelRatio,
  pageSize,
  strokeStep,
  pageNumber,
  isRendering,
  setIsRendering,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const scale = useRef(1);
  const isDrawing = useRef(false);
  const touchPoints = useRef(0);
  const pathsRef = useRef<PathsType[]>([]);
  const paths = useRef<{ [pageNumber: number]: PathsType[] }>({});
  const [canDraw, setCanDraw] = useState(false);
  const [drawOrder, setDrawOrder] = useState(0);
  const [color, setColor] = useState<(typeof colorMap)[number]>("#F34A47");
  const [touchType, setTouchType] = useState<TouchType>("pen");
  const [drawType, setDrawType] = useState<DrawType>("pen");
  const [zoomEnabled, setZoomEnabled] = useState(false);

  const startDrawing = useCallback(
    (e: canvasEventType) => {
      touchPoints.current += 1;
      // nativeLog(e.pointerType);
      e.persist();
      if (
        !canDraw ||
        !canvas.current ||
        e.pointerType !== touchType ||
        touchPoints.current === 2
      ) {
        return;
      }
      isDrawing.current = true;
      // const context = canvas.current.getContext("2d")!;
      const lineWidth =
        (strokeStep * (drawType === "highlight" ? 2 : 1)) / pageSize.width;
      const { x, y } = getDrawingPosition(
        canvas,
        e,
        devicePixelRatio,
        scale.current
      );

      // if (drawType === "eraser") {
      //   drawDashedLine(context, x, y, x, y);
      // } else {
      //   drawSmoothLine(
      //     context,
      //     x,
      //     y,
      //     x,
      //     y,
      //     color,
      //     strokeStep * (drawType === "highlight" ? 2 : 1),
      //     drawType === "highlight" ? 0.4 : 1
      //   );
      // }

      pathsRef.current.push({
        x: x / pageSize.width,
        y: y / pageSize.height,
        lastX: x / pageSize.width,
        lastY: y / pageSize.height,
        lineWidth,
        color,
        drawOrder,
        alpha: drawType === "highlight" ? 0.4 : 1,
      });
      lastXRef.current = x;
      lastYRef.current = y;
    },
    [
      canDraw,
      color,
      devicePixelRatio,
      drawOrder,
      drawType,
      pageSize,
      strokeStep,
      touchPoints,
      touchType,
    ]
  );

  const draw = (e: canvasEventType) => {
    e.persist();
    if (!canvas.current || !isDrawing.current || touchPoints.current === 2)
      return;
    const context = canvas.current.getContext("2d")!;
    const { x, y } = getDrawingPosition(
      canvas,
      e,
      devicePixelRatio,
      scale.current
    );

    const distance = Math.hypot(x - lastXRef.current, y - lastYRef.current);
    const DISTANCE_THRESHOLD = 20;
    const lineWidth =
      (strokeStep * (drawType === "highlight" ? 2 : 1)) / pageSize.width;

    if (distance >= DISTANCE_THRESHOLD) {
      if (drawType === "eraser") {
        drawDashedLine(context, lastXRef.current, lastYRef.current, x, y);
      } else {
        drawSmoothLine(
          context,
          lastXRef.current,
          lastYRef.current,
          x,
          y,
          color,
          strokeStep * (drawType === "highlight" ? 2 : 1),
          drawType === "highlight" ? 0.4 : 1
        );
      }

      pathsRef.current.push({
        x: x / pageSize.width,
        y: y / pageSize.height,
        lastX: lastXRef.current / pageSize.width,
        lastY: lastYRef.current / pageSize.height,
        lineWidth,
        color,
        drawOrder,
        alpha: drawType === "highlight" ? 0.4 : 1,
      });

      lastXRef.current = x;
      lastYRef.current = y;
    }
  };

  const redrawPaths = useCallback(
    (pageWidth: number, pageHeight: number) => {
      if (canvas.current) {
        const context = canvas.current.getContext("2d")!;

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
                    currentGroup[j].lineWidth * pageWidth,
                    currentGroup[j].alpha
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
                  points[1].lineWidth * pageWidth,
                  points[1].alpha
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
                currentGroup[j].lineWidth * pageWidth,
                currentGroup[j].alpha
              );
            }
          }
        }

        setIsRendering(false);
      }
    },
    [pageNumber, setIsRendering]
  );

  const stopDrawing = useCallback(async () => {
    isDrawing.current = false;
    touchPoints.current = 0;
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
          const distance = Math.hypot(
            path.x * pageSize.width - eraseX,
            path.y * pageSize.height - eraseY
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
            const midDistance = Math.hypot(midX - eraseX, midY - eraseY);
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

      context.clearRect(0, 0, canvas.current.width, canvas.current.height); // 전체 캔버스 지우기
      redrawPaths(pageSize.width, pageSize.height);
    }

    if (pathsRef.current.length > 0 && drawType !== "eraser") {
      const newValue = pathsRef.current;
      setDrawOrder((prev) => prev + 1);
      paths.current = {
        ...paths.current,
        [pageNumber]: [...(paths.current[pageNumber] || []), ...newValue],
      };
      // pathsRef 초기화
      pathsRef.current = [];
    }
  }, [drawType, pageNumber, pageSize, redrawPaths, strokeStep]);

  return {
    canvas,
    canDraw,
    paths,
    scale,
    isRendering,
    drawType,
    color,
    touchType,
    zoomEnabled,
    setZoomEnabled,
    setCanDraw,
    setColor,
    setDrawType,
    startDrawing,
    draw,
    redrawPaths,
    stopDrawing,
    setTouchType,
  };
}
