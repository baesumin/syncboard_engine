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

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function App() {
  const setFile = useSetAtom(fileAtom);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeFile = async () => {
      if (__DEV__ || !isTablet) {
        import("./mock/base64").then(async ({ base64 }) => {
          // const base64 = await createPDFFromImgBase64(
          //   pngbase64.base64,
          //   pngbase64.type
          // );
          setFile({
            base64: base64.base64,
            paths: "",
            isNew: false,
            type: base64.type,
          });
          setIsLoading(false);
        });
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
