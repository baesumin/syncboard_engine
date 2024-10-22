import { pdfjs } from "react-pdf";
import Sample from "./Sample";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function App() {
  return <Sample />;
}

export default App;
