import { colorMap } from "../utils/common";

export type DrawType = "pen" | "highlight" | "eraser" | "zoom";
export type canvasEventType = React.PointerEvent<HTMLCanvasElement> &
  React.TouchEvent<HTMLCanvasElement>;
export type PathsType = {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  lineWidth: number;
  color: (typeof colorMap)[number];
  drawOrder: number;
  alpha: number;
};
