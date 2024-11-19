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
  drawOrder: number;
  alpha: number;
};
export type PageSize = { width: number; height: number };
export type webviewType = {
  webviewApi: (data: string) => void;
  getSearchText: (data: string) => void;
  getPageNumber: (data: string) => void;
  getBase64: () => void;
  newPage: () => void;
  getPathData: () => void;
  endSearch: () => void;
  AndroidInterface: {
    getBase64: (data: string) => void;
    getPdfData: (data: string) => void;
    getSearchTextPageList: (data: string) => void;
    setFullMode: (data: boolean) => void;
  };
};
export type PdfStateType = {
  isToolBarOpen: boolean;
  isListOpen: boolean;
  isFullScreen: boolean;
  isStrokeOpen: boolean;
  pageNumber: number;
  totalPage: number;
  renderedPageNumber: number;
  canRenderThumbnail: boolean;
};
export type PdfConfigType = {
  size: { width: number; height: number };
  strokeStep: number;
  devicePixelRatio: number;
};
