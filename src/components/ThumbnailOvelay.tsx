import clsx from "clsx";
import { Close } from "../assets/icons";
import { Thumbnail } from "react-pdf";
import { useAtom } from "jotai";
import { pdfStateAtom } from "../store/pdf";

const ThumbnailOvelay = () => {
  const [pdfState, setPdfState] = useAtom(pdfStateAtom);

  return (
    <div
      className={clsx(
        "absolute top-0 left-0 bottom-0 right-0 overflow-auto bg-black/70 px-[20px] pt-[24px] z-[9999]",
        pdfState.isListOpen ? "" : "hidden"
      )}
    >
      <div className="flex justify-end items-center">
        <button
          onClick={() => {
            setPdfState({
              ...pdfState,
              isListOpen: false,
            });
          }}
          className="bg-white size-[44px] flex-center rounded-xl"
        >
          <Close />
        </button>
      </div>
      <div
        className="grid mt-[20px] gap-y-5"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        }}
      >
        {[...new Array(pdfState.totalPage)].map((_, index) => {
          return (
            <div key={index} className="w-[180px]">
              <div
                className={clsx(
                  pdfState.pageNumber === index + 1
                    ? "border-[3px] border-[#FF9A51]"
                    : "",
                  "overflow-hidden"
                )}
              >
                <Thumbnail
                  pageNumber={index + 1}
                  width={180}
                  devicePixelRatio={2}
                  onItemClick={({ pageNumber }) => {
                    setPdfState({
                      ...pdfState,
                      pageNumber: pageNumber,
                      isListOpen: false,
                    });
                  }}
                  loading={<></>}
                />
              </div>
              <div className="h-[31px] flex justify-center items-center">
                <span
                  className={
                    pdfState.pageNumber === index + 1
                      ? "text-[#FF9A51] font-bold text-lg"
                      : "text-white"
                  }
                >
                  {index + 1}/{pdfState.totalPage}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThumbnailOvelay;
