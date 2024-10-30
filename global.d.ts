declare global {
  interface Window {
    webviewApi: {
      sendMessage: (message: string) => void;
      onMessage: (callback: (message: string) => void) => void;
    };
  }
}

export {};
