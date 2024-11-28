import "react-pdf/dist/esm/Page/TextLayer.css";
import { pdfjs } from "react-pdf";
import PdfEngine from "./PdfEngine";
import { useEffect, useState } from "react";
import { __DEV__ } from "./utils/common";
import { emptyPageBase64 } from "./mock/emptyPageBase64";
import { useSetAtom } from "jotai";
import { fileAtom } from "./store/pdf";
import { isDesktop } from "react-device-detect";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function App() {
  const setFile = useSetAtom(fileAtom);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeFile = async () => {
      if (__DEV__ || isDesktop) {
        import("./mock/base64").then(() => {
          setFile({
            base64: emptyPageBase64,
            paths: "",
            isNew: true,
          });
          setIsLoading(false);
        });
        return;
      }

      window.webviewApi = (appData: string) => {
        const param = JSON.parse(appData);
        setFile({
          base64: param?.data?.isNew ? emptyPageBase64 : param?.data?.base64,
          paths: param?.data?.paths,
          isNew: param?.data?.isNew,
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
