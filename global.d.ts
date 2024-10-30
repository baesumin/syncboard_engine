declare global {
  interface Window {
    webviewApi: (data: string) => void; // webviewApi를 함수로 정의
  }
}

export {};
