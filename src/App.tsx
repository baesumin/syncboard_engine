import "react-pdf/dist/esm/Page/TextLayer.css";
import { pdfjs } from "react-pdf";
import PdfEngine from "./PdfEngine";
import { useEffect, useState } from "react";
import { __DEV__ } from "./utils/common";
import { emptyPageBase64 } from "./mock/emptyPageBase64";
import { useSetAtom } from "jotai";
import { fileAtom } from "./store/pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function App() {
  const setFile = useSetAtom(fileAtom);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeFile = async () => {
      if (!__DEV__) {
        if (window.webviewApi !== undefined) {
          window.webviewApi = (appData: string) => {
            const param = JSON.parse(appData);
            setFile({
              base64: param?.data?.isNew
                ? emptyPageBase64
                : param?.data?.base64,
              paths: param?.data?.paths,
              isNew: param?.data?.isNew,
            });
            setIsLoading(false);
          };
        } else {
          const { base64 } = await import("./mock/base64");
          setFile({
            base64: base64.base64,
            paths: "",
            isNew: false,
          });
          setIsLoading(false);
        }
      } else {
        const { base64 } = await import("./mock/base64");
        setFile({
          base64: base64.base64,
          paths: "",
          isNew: false,
        });
        setIsLoading(false);
      }
    };

    initializeFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{!isLoading && <PdfEngine />}</>;
}

export default App;
