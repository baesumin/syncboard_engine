import "react-pdf/dist/esm/Page/TextLayer.css";
import { pdfjs } from "react-pdf";
import PdfEngine from "./PdfEngine";
import { useEffect, useState } from "react";
import {
  __DEV__,
  blobToBase64,
  createOrMergePdf,
  createPDFFromImgBase64,
} from "./utils/common";
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
      if (__DEV__ || !window.webviewApi) {
        const response = await fetch(
          "https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf"
        );
        const blob = await response.blob();
        const base64 = (await blobToBase64(blob)) as string;
        setFile({
          base64: base64.replace("data:application/pdf;base64,", ""),
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
