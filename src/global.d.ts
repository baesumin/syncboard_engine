interface Window {
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
    setPdfData: (data: boolean) => void;
  };
}
