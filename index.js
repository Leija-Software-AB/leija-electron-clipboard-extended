const { clipboard } = require("electron");
const EventEmitter = require("./EventEmitter");
const { spawnSync } = require("child_process");
const clipboardEmitter = new EventEmitter();

const getFileClip = () =>
  spawnSync("powershell", [
    "-Command",
    "Get-Clipboard -Format FileDropList",
  ]).stdout.toString()

let watcherId = null, previousText = clipboard.readText(), previousImage = clipboard.readImage(), previousFile = getFileClip();

clipboard.on = (event, listener) => {
    clipboardEmitter.on(event, listener)
    return clipboard
}

clipboard.once = (event, listener) => {
    clipboardEmitter.once(event, listener)
    return clipboard
}

clipboard.off = (event, listener) => {
    if(listener)
        clipboardEmitter.removeListener(event, listener)
    else
        clipboardEmitter.removeAllListeners(event)
    return clipboard
}

clipboard.startWatching = () => {
  if (!watcherId)
    watcherId = setInterval(() => {
      if (process.platform == "win32") {
        if (isDiffText(previousText, (previousText = clipboard.readText())))
          clipboardEmitter.emit("text-changed");
        if (isDiffImage(previousImage, (previousImage = clipboard.readImage())))
          clipboardEmitter.emit("image-changed");
        if (isDiffFile(previousFile, (previousFile = getFileClip())))
          clipboardEmitter.emit("file-changed");
      } else {
        if (isDiffText(previousText, (previousText = clipboard.readText())))
          clipboardEmitter.emit("text-changed");
        if (isDiffImage(previousImage, (previousImage = clipboard.readImage())))
          clipboardEmitter.emit("image-changed");
      }
    }, 500);
  return clipboard;
}

clipboard.stopWatching = () => {
    if(watcherId) clearInterval(watcherId)
    watcherId = null
    return clipboard
}

function isDiffText(str1, str2){
    return str2 && str1 !== str2
}

function isDiffImage(img1, img2){
    return !img2.isEmpty() && img1.toDataURL() !== img2.toDataURL()
}

function isDiffFile(file1, file2) {
  return file2 && file1 !== file2;
}

module.exports = clipboard
