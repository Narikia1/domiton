import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("domiton", {
  platform: process.platform,
  lookup: (query: string) => ipcRenderer.invoke("domiton:lookup", query),
});
