import { useEffect } from "react";
import { webviewType, PathsType, PdfStateType } from "../types/common";
import { webviewApiDataType } from "../types/json";
import {
  getModifiedPDFBase64,
  createOrMergePdf,
  __DEV__,
} from "../utils/common";

interface UseWebviewInterfaceProps {
  file: webviewApiDataType;
  paths: React.MutableRefObject<{ [pageNumber: number]: PathsType[] }>;
  pdfState: {
    pageNumber: number;
    totalPage: number;
  };
  setPdfState: React.Dispatch<React.SetStateAction<PdfStateType>>;
  setFile: (file: webviewApiDataType) => void;
  setSearchText: (text: string) => void;
  getSearchResult: (text: string) => any[];
}

export const useWebviewInterface = ({
  file,
  paths,
  pdfState,
  setPdfState,
  setFile,
  setSearchText,
  getSearchResult,
}: UseWebviewInterfaceProps) => {
  useEffect(() => {
    if (__DEV__) return;

    const webviewInterface = {
      getBase64: async () => {
        const data = await getModifiedPDFBase64(paths.current, file.base64);
        (window as unknown as webviewType).AndroidInterface.getBase64(data);
      },

      getPathData: () => {
        return JSON.stringify(paths.current);
      },

      newPage: async () => {
        const newBase64 = await createOrMergePdf(file.base64);
        setPdfState((prev) => ({
          ...prev,
          pageNumber: prev.totalPage + 1,
          totalPage: prev.totalPage + 1,
        }));
        setFile({
          ...file,
          base64: newBase64,
        });
      },

      getSearchText: (data: string) => {
        setSearchText(data);
        const resultsList = getSearchResult(data);
        return resultsList.map((result) => result.pageNumber);
      },

      getPageNumber: (data: string) => {
        if (!isNaN(Number(data))) {
          setPdfState((prev) => ({
            ...prev,
            pageNumber: Number(data),
          }));
        }
      },

      endSearch: () => {
        setSearchText("");
      },
    };

    // 웹뷰 인터페이스 메서드들을 window 객체에 할당
    Object.assign(window, webviewInterface);
  }, [
    file,
    paths,
    pdfState.totalPage,
    setPdfState,
    setFile,
    setSearchText,
    getSearchResult,
  ]);
};
