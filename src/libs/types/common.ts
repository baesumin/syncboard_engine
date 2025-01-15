import { colorMap } from "../utils/common";

export type DrawType = "pen" | "highlight" | "eraser";
export type TouchType = "touch" | "pen";
export type canvasEventType = React.PointerEvent<HTMLCanvasElement> &
  React.TouchEvent<HTMLCanvasElement>;
export type PathsType = {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  lineWidth: number;
  color: (typeof colorMap)[number];
  drawOrder: string;
  alpha: number;
};
export type PageSize = { width: number; height: number };
export type PdfStateType = {
  isToolBarOpen: boolean;
  isListOpen: boolean;
  isFullScreen: boolean;
  isStrokeOpen: boolean;
  pageNumber: number;
  totalPage: number;
  renderedPageNumber: number;
};
export type PdfConfigType = {
  size: { width: number; height: number };
  strokeStep: number;
  devicePixelRatio: number;
};
