import "react-pdf/dist/esm/Page/TextLayer.css";
import { pdfjs } from "react-pdf";
import PdfEngine from "./PdfEngine";
import { useEffect, useState } from "react";
import { __DEV__ } from "./utils/common";
import { webviewApiType } from "./types/json";
import { webviewType } from "./types/common";
import { emptyPageBase64 } from "./mock/emptyPageBase64";
import { isDesktop } from "react-device-detect";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function App() {
  const [file, setFile] = useState({
    base64: "",
    paths: "",
    isNew: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeFile = async () => {
      if (!__DEV__) {
        if (isDesktop) {
          const { base64 } = await import("./mock/base64");
          setFile({
            base64: base64.base64,
            paths: "",
            isNew: false,
          });
          setIsLoading(false);
          return;
        }
        (window as unknown as webviewType).webviewApi = (appData: string) => {
          const param: webviewApiType = JSON.parse(appData);
          setFile({
            base64: param?.data?.isNew ? emptyPageBase64 : param?.data?.base64,
            paths: param?.data?.paths,
            isNew: param?.data?.isNew,
          });
          setIsLoading(false);
        };
      } else {
        try {
          const { base64 } = await import("./mock/base64");
          setFile({
            base64: base64.base64,
            paths: "",
            isNew: false,
          });
        } catch (error) {
          console.error("Failed to load base64:", error);
        }
        setIsLoading(false);
      }
    };

    initializeFile();
  }, []);

  return <>{!isLoading && <PdfEngine file={file} setFile={setFile} />}</>;
}

export default App;
