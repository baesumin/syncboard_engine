import { rgb } from "pdf-lib";

export const colors = {
  black: rgb(0, 0, 0),
  blue: rgb(0, 0, 1),
  green: rgb(0, 1, 0),
  yellow: rgb(1, 1, 0),
  orange: rgb(1, 0.65, 0),
};

export type DrawType = React.PointerEvent<HTMLCanvasElement> &
  React.TouchEvent<HTMLCanvasElement>;

export type PathsType = {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  lineWidth: number;
  color: keyof typeof colors;
  drawOrder: number;
};

export const nativeLog = (
  value: unknown,
  webViewType = "ReactNativeWebView"
) => {
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
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(lastX, lastY);
  context.lineTo(x, y);
  context.strokeStyle = "red"; // 점선 색상
  context.lineWidth = 5;
  context.stroke();
  context.setLineDash([]); // 점선 스타일 초기화
  context.closePath();
};

export const drawSmoothLine = (
  context: CanvasRenderingContext2D,
  lastX: number,
  lastY: number,
  x: number,
  y: number,
  color: keyof typeof colors,
  lineWidth: number
) => {
  const radius = lineWidth / 2; // 원의 반지름을 선 두께의 절반으로 설정

  // 시작점에 원 그리기
  context.fillStyle = color;
  context.beginPath();
  context.arc(lastX, lastY, radius, 0, Math.PI * 2);
  context.fill();

  // 끝점에 원 그리기
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();

  // 선 그리기 (부드러운 선을 원으로 연결)
  context.beginPath();
  context.moveTo(lastX, lastY);
  context.lineTo(x, y);
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.stroke();
  context.closePath();
};

export const colorToRGB = (color: keyof typeof colors) => {
  return colors[color];
};
