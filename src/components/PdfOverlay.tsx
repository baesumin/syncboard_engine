import clsx from "clsx";
import {
  ArrowLeft,
  Checked,
  Close,
  Drawing,
  Eraser,
  FullScreen,
  Hightlighter,
  Pen,
  PenMode,
  SmallScreen,
  Stroke,
  Stroke1Step,
  Stroke2Step,
  Stroke3Step,
  Stroke4Step,
  Stroke5Step,
  ThumbnailList,
  TouchMode,
  Trash,
  Zoom,
} from "../assets/icons";
import { Dispatch, SetStateAction } from "react";
import { __DEV__, colorMap, getModifiedPDFBase64 } from "../utils/common";
import { DrawType, PathsType, TouchType, webviewType } from "../types/common";

interface Props {
  pageNumber: number;
  isFullScreen: boolean;
  drawType: DrawType;
  isToolBarOpen: boolean;
  isStrokeOpen: boolean;
  color: (typeof colorMap)[number];
  strokeStep: number;
  file: string;
  paths: { [pageNumber: number]: PathsType[] };
  totalPage: number;
  touchType: TouchType;
  zoomEnabled: boolean;
  setZoomEnabled: Dispatch<SetStateAction<boolean>>;
  setTouchType: Dispatch<SetStateAction<TouchType>>;
  setIsListOpen: Dispatch<SetStateAction<boolean>>;
  setIsFullScreen: Dispatch<SetStateAction<boolean>>;
  setPageNumber: Dispatch<SetStateAction<number>>;
  setCanDraw: Dispatch<SetStateAction<boolean>>;
  setDrawType: Dispatch<SetStateAction<DrawType>>;
  setIsToolBarOpen: Dispatch<SetStateAction<boolean>>;
  setIsStrokeOpen: Dispatch<SetStateAction<boolean>>;
  setColor: Dispatch<SetStateAction<(typeof colorMap)[number]>>;
  setStrokeStep: Dispatch<SetStateAction<number>>;
  onNewPageClick: () => void;
  onEraseAllClick: () => void;
}

const PdfOverlay = ({
  pageNumber,
  totalPage,
  isFullScreen,
  drawType,
  isToolBarOpen,
  isStrokeOpen,
  color,
  strokeStep,
  file,
  paths,
  touchType,
  zoomEnabled,
  setZoomEnabled,
  setTouchType,
  setIsListOpen,
  setIsFullScreen,
  setPageNumber,
  setCanDraw,
  setDrawType,
  setIsToolBarOpen,
  setIsStrokeOpen,
  setColor,
  setStrokeStep,
  onNewPageClick,
  onEraseAllClick,
}: Props) => {
  return (
    <>
      <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col justify-between px-[20px] py-[20px] pointer-events-none">
        <div className="flex h-[52px] justify-between items-center">
          <button
            onClick={() => setIsListOpen(true)}
            className="pointer-events-auto h-[48px] rounded-[10px] bg-[#202325]/70 flex items-center pl-[2px] pr-4 gap-3"
          >
            <div className="size-[44px] bg-white rounded-lg flex-center">
              <ThumbnailList />
            </div>
            <span className="text-white text-lg">{`${pageNumber}/${totalPage}`}</span>
          </button>
          <button
            onClick={() => {
              setIsFullScreen((prev) => !prev);
              if (!__DEV__) {
                (window as unknown as webviewType).AndroidInterface.setFullMode(
                  !isFullScreen
                );
              }
            }}
            className="pointer-events-auto size-[44px] rounded-lg bg-white shadow-black shadow-sm flex-center"
          >
            {isFullScreen ? <SmallScreen /> : <FullScreen />}
          </button>
        </div>

        {totalPage > 1 && (
          <div className="flex justify-between mx-[-20px]">
            <button
              onClick={() => {
                if (pageNumber !== 1) {
                  setPageNumber((prev) => prev - 1);
                }
              }}
              className="pointer-events-auto w-[80px] h-[160px] rounded-tr-[100px] rounded-br-[100px] bg-[#56657E]/50 flex-center text-white"
            >
              <ArrowLeft color={pageNumber === 1 ? "#BCC2CB" : "white"} />
            </button>
            <button
              onClick={() => {
                if (pageNumber !== totalPage) {
                  setPageNumber((prev) => prev + 1);
                }
              }}
              className="pointer-events-auto w-[80px] h-[160px] rounded-tl-[100px] rounded-bl-[100px] bg-[#56657E]/50 flex-center text-white"
            >
              <div className="rotate-180">
                <ArrowLeft
                  color={pageNumber === totalPage ? "#BCC2CB" : "white"}
                />
              </div>
            </button>
          </div>
        )}

        <div className="flex h-[56px] justify-center">
          {!isToolBarOpen && (
            <button
              onClick={() => {
                setCanDraw((prev) => !prev);
                setIsToolBarOpen(true);
              }}
              className="pointer-events-auto w-[114px] h-[56px] rounded-xl bg-white shadow-black shadow-sm flex-center gap-[9px]"
            >
              <Drawing />
              그리기
            </button>
          )}
          {!isToolBarOpen && import.meta.env.MODE === "development" && (
            <>
              <button
                onClick={async () => {
                  await getModifiedPDFBase64(paths, file);
                }}
                className="pointer-events-auto w-[114px] h-[56px] rounded-xl bg-white shadow-black shadow-sm flex-center gap-[9px]"
              >
                저장
              </button>
              <button
                onClick={onNewPageClick}
                className="pointer-events-auto w-[114px] h-[56px] rounded-xl bg-white shadow-black shadow-sm flex-center gap-[9px]"
              >
                페이지 추가
              </button>
            </>
          )}
          {isToolBarOpen && (
            <div className="h-[56px] bg-white rounded-xl flex items-center px-[8px] shadow-black shadow-sm">
              <div className="w-[140px] flex justify-between">
                <button
                  onClick={() => {
                    setCanDraw(true);
                    setDrawType("pen");
                    setZoomEnabled(false);
                  }}
                  className={clsx(
                    "pointer-events-auto size-[44px] rounded-lg flex-center",
                    drawType === "pen" && !zoomEnabled
                      ? "bg-[#5865FA]"
                      : "#ffffff"
                  )}
                >
                  <Pen
                    color={
                      drawType === "pen" && !zoomEnabled ? "#ffffff" : "#353B45"
                    }
                  />
                </button>
                <button
                  onClick={() => {
                    setCanDraw(true);
                    setDrawType("highlight");
                    setZoomEnabled(false);
                  }}
                  className={clsx(
                    "pointer-events-auto size-[44px] rounded-lg flex-center",
                    drawType === "highlight" && !zoomEnabled
                      ? "bg-[#5865FA]"
                      : "#ffffff"
                  )}
                >
                  <Hightlighter
                    color={
                      drawType === "highlight" && !zoomEnabled
                        ? "#ffffff"
                        : "#353B45"
                    }
                  />
                </button>
                <button
                  onClick={() => {
                    setCanDraw(true);
                    setDrawType("eraser");
                    setZoomEnabled(false);
                  }}
                  className={clsx(
                    "pointer-events-auto size-[44px] rounded-lg flex-center",
                    drawType === "eraser" && !zoomEnabled
                      ? "bg-[#5865FA]"
                      : "#ffffff"
                  )}
                >
                  <Eraser
                    color={
                      drawType === "eraser" && !zoomEnabled
                        ? "#ffffff"
                        : "#353B45"
                    }
                  />
                </button>
              </div>
              <div className="w-[1px] h-[40px] bg-[#EEEFF3] mx-[8px]" />
              {drawType !== "eraser" ? (
                <>
                  <div className="flex flex-row w-[220px] justify-between">
                    {colorMap.map((item) => {
                      return (
                        <div
                          key={item}
                          className="pointer-events-auto size-[44px] flex-center"
                          onClick={() => {
                            setColor(item);
                          }}
                        >
                          <div
                            className="rounded-full size-[24px] flex-center"
                            style={{ backgroundColor: item }}
                          >
                            {item === color && <Checked color={"white"} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-[1px] h-[40px] bg-[#EEEFF3] mx-[8px]" />
                  <button
                    onClick={() => setIsStrokeOpen((prev) => !prev)}
                    className={clsx(
                      "pointer-events-auto size-[44px] rounded-lg flex-center",
                      isStrokeOpen ? "bg-[#EEEFF3]" : "#ffffff"
                    )}
                  >
                    <Stroke />
                    {isStrokeOpen && (
                      <div className="bg-white w-[60px] h-[236px] absolute bottom-[90px] rounded-lg shadow-black shadow-sm flex flex-col justify-center items-center">
                        <button
                          onClick={() => setStrokeStep(20)}
                          className={
                            "pointer-events-auto size-[44px] flex-center"
                          }
                        >
                          <Stroke5Step
                            color={strokeStep === 20 ? color : "#BCC2CB"}
                          />
                        </button>
                        <button
                          onClick={() => setStrokeStep(16)}
                          className="pointer-events-auto size-[44px] flex-center"
                        >
                          <Stroke4Step
                            color={strokeStep === 16 ? color : "#BCC2CB"}
                          />
                        </button>
                        <button
                          onClick={() => setStrokeStep(12)}
                          className="pointer-events-auto size-[44px] flex-center"
                        >
                          <Stroke3Step
                            color={strokeStep === 12 ? color : "#BCC2CB"}
                          />
                        </button>
                        <button
                          onClick={() => setStrokeStep(8)}
                          className="pointer-events-auto size-[44px] flex-center"
                        >
                          <Stroke2Step
                            color={strokeStep === 8 ? color : "#BCC2CB"}
                          />
                        </button>
                        <button
                          onClick={() => setStrokeStep(4)}
                          className="pointer-events-auto size-[44px] flex-center"
                        >
                          <Stroke1Step
                            color={strokeStep === 4 ? color : "#BCC2CB"}
                          />
                        </button>
                      </div>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={onEraseAllClick}
                  className="pointer-events-auto flex gap-x-2 px-[10px]"
                >
                  <Trash />
                  <span className="text-[#353B45]">모두 지우기</span>
                </button>
              )}
              <div className="w-[1px] h-[40px] bg-[#EEEFF3] mx-[8px]" />
              <button
                onClick={() => {
                  setCanDraw(zoomEnabled ? false : true);
                  setTouchType((prev) => (prev === "pen" ? "touch" : "pen"));
                }}
                className="pointer-events-auto w-[78px] h-[44px] rounded-lg bg-[#EEEFF3] flex items-center px-[4px]"
              >
                <div
                  className={clsx(
                    "size-[36px] bg-white rounded-md shadow flex-center transition-transform duration-300",
                    touchType === "pen" ? "translate-x-0" : "translate-x-[34px]"
                  )}
                >
                  {touchType === "pen" ? <PenMode /> : <TouchMode />}
                </div>
              </button>
              {touchType === "touch" && (
                <button
                  onClick={() => {
                    setZoomEnabled((prev) => {
                      setCanDraw(prev);
                      return !prev;
                    });
                  }}
                  className={clsx(
                    "pointer-events-auto size-[44px] rounded-lg flex-center ml-[8px]",
                    zoomEnabled ? "bg-[#5865FA]" : "#ffffff"
                  )}
                >
                  <Zoom color={zoomEnabled ? "#ffffff" : "#353B45"} />
                </button>
              )}
              <div className="w-[1px] h-[40px] bg-[#EEEFF3] mx-[8px]" />
              <button
                onClick={() => {
                  setCanDraw(false);
                  setIsToolBarOpen(false);
                  setDrawType("pen");
                }}
                className="pointer-events-auto size-[44px] flex-center"
              >
                <Close />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PdfOverlay;
