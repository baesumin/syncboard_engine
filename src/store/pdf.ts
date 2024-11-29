import { atom } from "jotai";

export const fileAtom = atom({
  base64: "",
  paths: "",
  isNew: false,
  type: "",
});
export const searchTextAtom = atom("");
export const pdfStateAtom = atom({
  isToolBarOpen: false,
  isListOpen: false,
  isFullScreen: false,
  isStrokeOpen: false,
  pageNumber: 1,
  totalPage: 1,
  renderedPageNumber: 0,
  canRenderThumbnail: false,
  isDocumentLoading: true,
});
export const pdfConfigAtom = atom({
  size: { width: 0, height: 0 },
  strokeStep: 16,
  devicePixelRatio: 2,
});
