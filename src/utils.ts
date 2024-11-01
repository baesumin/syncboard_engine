/* eslint-disable @typescript-eslint/ban-ts-comment */
import { rgb } from "pdf-lib";

export const colorMap = [
  "#202325",
  "#007AFF",
  "#54B41D",
  "#FFBB00",
  "#F34A47",
] as const;

export const colors = {
  "#202325": rgb(32 / 255, 35 / 255, 37 / 255),
  "#007AFF": rgb(0 / 255, 122 / 255, 255 / 255),
  "#54B41D": rgb(84 / 255, 180 / 255, 29 / 255),
  "#FFBB00": rgb(255 / 255, 187 / 255, 0 / 255),
  "#F34A47": rgb(243 / 255, 74 / 255, 71 / 255),
} as const;

export type DrawType = React.PointerEvent<HTMLCanvasElement> &
  React.TouchEvent<HTMLCanvasElement>;

export type PathsType = {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  lineWidth: number;
  color: (typeof colorMap)[number];
  drawOrder: number;
};

export const nativeLog = (
  value: unknown,
  webViewType = "ReactNativeWebView"
) => {
  //@ts-ignore
  window[webViewType]?.postMessage(
    JSON.stringify({
      type: "log",
      value: JSON.stringify(value),
    })
  );
};

export const postMessage = (
  type: string,
  value?: unknown,
  webViewType = "ReactNativeWebView"
) => {
  //@ts-ignore
  return window[webViewType]?.postMessage(
    JSON.stringify({
      type,
      value: JSON.stringify(value),
    })
  );
};

export const getClientPosition = (
  e: DrawType,
  devicePixelRatio: number,
  type: "x" | "y"
) => {
  return (
    (e.nativeEvent instanceof MouseEvent
      ? e[type === "x" ? "clientX" : "clientY"]
      : e.touches[0][type === "x" ? "clientX" : "clientY"]) * devicePixelRatio
  );
};

export const getDrawingPosition = (
  canvas: React.RefObject<HTMLCanvasElement>,
  e: DrawType,
  devicePixelRatio: number,
  scale: number
) => {
  if (!canvas.current) {
    return { x: 0, y: 0 };
  }

  const rect = canvas.current.getBoundingClientRect(); // 캔버스의 위치와 크기를 가져옴
  const clientX = getClientPosition(e, devicePixelRatio, "x");
  const clientY = getClientPosition(e, devicePixelRatio, "y");
  const x = (clientX - devicePixelRatio * rect.left) / scale;
  const y = (clientY - devicePixelRatio * rect.top) / scale;

  return { x, y };
};

// 선분과 점 간의 거리 계산
export const distanceToLine = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  const param = len_sq !== 0 ? dot / len_sq : -1;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

export const drawDashedLine = (
  context: CanvasRenderingContext2D,
  lastX: number,
  lastY: number,
  x: number,
  y: number
) => {
  context.setLineDash([1, 10]); // 점선 스타일 설정
  context.strokeStyle = "red"; // 점선 색상
  context.lineWidth = 5;
  context.lineCap = "round";
  context.moveTo(lastX, lastY);
  context.lineTo(x, y);
  context.stroke();
  context.setLineDash([]); // 점선 스타일 초기화
};

export const drawSmoothLine = (
  context: CanvasRenderingContext2D,
  lastX: number,
  lastY: number,
  x: number,
  y: number,
  color: (typeof colorMap)[number],
  lineWidth: number
) => {
  context.beginPath();
  // context.globalCompositeOperation = "source-over";
  // context.globalAlpha = 1;
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.lineCap = "round";
  context.moveTo(lastX, lastY);
  context.lineTo(x, y);
  context.stroke();
  context.closePath();
};

export const drawHighlightLine = (
  context: CanvasRenderingContext2D,
  lastX: number,
  lastY: number,
  x: number,
  y: number,
  color: (typeof colorMap)[number],
  lineWidth: number
) => {
  const rgba = hexToRGBA(color, 0.3);
  context.globalCompositeOperation = "multiply";
  context.strokeStyle = rgba;
  context.lineWidth = lineWidth;
  context.lineCap = "round";
  context.globalAlpha = 0.1;
  context.moveTo(lastX, lastY);
  context.lineTo(x, y);
  context.stroke();
};

export const colorToRGB = (color: (typeof colorMap)[number]) => {
  return colors[color as keyof typeof colors];
};

// hex 컬러를 rgba로 변환하는 유틸 함수
const hexToRGBA = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
