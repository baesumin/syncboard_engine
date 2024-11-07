export interface webviewApiType {
  data: webviewApiDataType;
}

export interface webviewApiDataType {
  base64: string;
  paths: string;
  isNew: boolean;
}
