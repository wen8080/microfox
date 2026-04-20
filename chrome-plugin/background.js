// 插件后台：接收截图请求
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "capture-visible") {
    chrome.tabs.captureVisibleTab({ format: "png" }, (dataUrl) => {
      sendResponse({ base64: dataUrl });
    });
    return true;
  }
});