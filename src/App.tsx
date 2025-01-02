import "react-pdf/dist/esm/Page/TextLayer.css";
import { pdfjs } from "react-pdf";
import PdfEngine from "./PdfEngine";
import { useEffect, useState } from "react";
import {
  __DEV__,
  createOrMergePdf,
  createPDFFromImgBase64,
} from "./utils/common";
import { useSetAtom } from "jotai";
import { fileAtom } from "./store/pdf";
import { isTablet } from "react-device-detect";
import { base64 } from "./mock/base64";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?worker&url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

function App() {
  const setFile = useSetAtom(fileAtom);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeFile = async () => {
      if (__DEV__ || !isTablet) {
        setFile({
          base64: base64,
          paths: "",
          isNew: false,
          type: "pdf",
        });
        setIsLoading(false);
        return;
      }

      window.webviewApi = async (appData: string) => {
        const param = JSON.parse(appData);
        setFile({
          base64: param?.data?.isNew
            ? await createOrMergePdf()
            : param?.data?.type === "pdf"
            ? param?.data?.base64
            : await createPDFFromImgBase64(
                param?.data?.base64,
                param?.data?.type
              ),
          paths: param?.data?.paths,
          isNew: param?.data?.isNew,
          type: param?.data?.type,
        });
        setIsLoading(false);
      };
    };

    initializeFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{!isLoading && <PdfEngine />}</>;
}

export default App;
