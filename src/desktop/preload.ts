import { contextBridge, ipcRenderer } from "electron";

/** What the main process set when it opened the window. */
function argument(name: string): string {
  return process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? "";
}

contextBridge.exposeInMainWorld("domiton", {
  platform: process.platform,
  languages: argument("domiton-languages").split(",").filter(Boolean),
  country: argument("domiton-country") || null,
  lookup: (query: string, locale?: string) => ipcRenderer.invoke("domiton:lookup", query, locale),
});
