import { PathsType } from "./common";

export interface webviewApiType {
  data: webviewApiDataType;
}

export interface webviewApiDataType {
  base64: string;
  paths: { [pageNumber: number]: PathsType[] };
  isNew: boolean;
}
