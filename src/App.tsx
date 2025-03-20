import "react-pdf/dist/esm/Page/TextLayer.css";
import { pdfjs } from "react-pdf";
import PdfEngine from "./PdfEngine";
import { useEffect, useState } from "react";
import {
  __DEV__,
  createOrMergePdf,
  createPDFFromImgBase64,
} from "./libs/utils/common";
import { useSetAtom } from "jotai";
import { fileAtom } from "./store/pdf";
import { isTablet } from "react-device-detect";
import { base64 } from "./libs/mock/base64";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?worker&url";
import { useTranslation } from "./hooks/useTranslation";
import Loading from "./components/Loading";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

function App() {
  const { changeLanguage } = useTranslation();
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
        changeLanguage("ko");
        setIsLoading(false);
        return;
      }

      window.webviewApi = async (appData: string) => {
        window.AndroidInterface.getDataOk(true);
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
        changeLanguage(param?.data?.lang ?? "ko");
        setIsLoading(false);
      };
    };

    initializeFile();
  }, [changeLanguage, setFile]);

  return <>{isLoading ? <Loading /> : <PdfEngine />}</>;
}

export default App;
