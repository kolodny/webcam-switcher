(async () => {
  setTimeout(async () => {
    const root = chrome.runtime.getURL("/");
    const src = chrome.runtime.getURL("content_script.js");
    const settings = (await chrome.storage.sync.get("settings"))?.settings;
    const script = document.createElement("script");
    script.type = "module";
    script.src = src;
    script.setAttribute("data-root", root);
    if (settings) {
      script.setAttribute("data-settings", JSON.stringify(settings));
    }
    const head =
      document.head ||
      document.getElementsByTagName("head")[0] ||
      document.documentElement;
    head.appendChild(script);
  }, 100);
})();
