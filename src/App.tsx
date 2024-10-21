import { pdfjs } from "react-pdf";
import Sample from "./Sample";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function App() {
  return (
    <div className="flex w-full h-screen">
      <Sample />
    </div>
  );
}

export default App;
