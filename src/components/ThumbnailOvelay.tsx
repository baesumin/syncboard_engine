import clsx from "clsx";
import { Close } from "../assets/icons";
import { Dispatch, RefObject, SetStateAction } from "react";
import { ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import { Thumbnail } from "react-pdf";

interface Props {
  totalPage: number;
  pageNumber: number;
  scaleRef: RefObject<ReactZoomPanPinchContentRef>;
  setIsListOpen: Dispatch<SetStateAction<boolean>>;
  setPageNumber: Dispatch<SetStateAction<number>>;
}

const ThumbnailOvelay = ({
  totalPage,
  pageNumber,
  scaleRef,
  setIsListOpen,
  setPageNumber,
}: Props) => {
  return (
    <div
      className={clsx(
        "absolute top-0 left-0 bottom-0 right-0 overflow-auto bg-black/70 px-[20px] pt-[24px] z-[9999]"
      )}
    >
      <div className="flex justify-end items-center">
        <button
          onClick={() => setIsListOpen(false)}
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
        {[...new Array(totalPage)].map((_, index) => {
          return (
            <div key={index} className="w-[180px]">
              <div
                className={clsx(
                  pageNumber === index + 1
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
                    scaleRef.current?.resetTransform(0);
                    setPageNumber(pageNumber);
                    setIsListOpen(false);
                  }}
                  loading={<></>}
                />
              </div>
              <div className="h-[31px] flex justify-center items-center">
                <span
                  className={
                    pageNumber === index + 1
                      ? "text-[#FF9A51] font-bold text-lg"
                      : "text-white"
                  }
                >
                  {index + 1}/{totalPage}
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
