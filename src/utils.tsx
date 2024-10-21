export type DrawType = React.PointerEvent<HTMLCanvasElement> &
  React.TouchEvent<HTMLCanvasElement>;

export type PathsType = { x: number; y: number; lastX: number; lastY: number };

export const NativeLog = (
  text: unknown,
  webViewType = "ReactNativeWebView"
) => {
  window[webViewType]?.postMessage(
    JSON.stringify({
      type: "log",
      value: JSON.stringify(text),
    })
  );
};

export const PostMessage = (
  type: string,
  value: string,
  webViewType = "ReactNativeWebView"
) => {
  return window[webViewType]?.postMessage(
    JSON.stringify({
      type,
      value,
    })
  );
};

export const GetClientPosition = (
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

export const DrawSmoothLine = (
  context: CanvasRenderingContext2D,
  lastX: number,
  lastY: number,
  x: number,
  y: number,
  color: string,
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
