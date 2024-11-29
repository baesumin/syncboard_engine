import "react-pdf/dist/esm/Page/TextLayer.css";
import { pdfjs } from "react-pdf";
import PdfEngine from "./PdfEngine";
import { useEffect, useState } from "react";
import { __DEV__, createOrMergePdf } from "./utils/common";
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
        import("./mock/base64").then(({ base64 }) => {
          setFile({
            base64: base64.base64,
            paths: "",
            isNew: false,
            type: "",
          });
          setIsLoading(false);
        });
        return;
      }

      window.webviewApi = async (appData: string) => {
        const param = JSON.parse(appData);
        console.log(param?.data);
        setFile({
          base64: param?.data?.isNew
            ? await createOrMergePdf()
            : param?.data?.base64,
          paths: param?.data?.paths,
          isNew: param?.data?.isNew,
          type: "",
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
