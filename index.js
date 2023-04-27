const { clipboard } = require("electron");
const EventEmitter = require("./EventEmitter");
const { spawnSync } = require("child_process");
const path = require("path");
const clipboardEmitter = new EventEmitter();

/* Get-Clipboard -Format FileDropList -Raw

Set-Clipboard -Path 'H:\My Documents\linux-basics-1-2-exercises-swedish.pdf' [-Append] */

// unpack powershell from lib depending on os platform

clipboard.getPowerShell = () => {
  switch (process.platform) {
    case "win32":
      return "powershell";
    case "darwin":
      // unpack powershell from lib
      return path.join(__dirname, "./lib/powershell-macos/pwsh");
    case "linux":
      // unpack powershell from lib
      return path.join(__dirname, "./lib/powershell-linux/pwsh");
    default:
      return "powershell";
  }
};

clipboard.readFile = () =>
  spawnSync(clipboard.getPowerShell(), [
    "-Command",
    "Get-Clipboard -Format FileDropList",
  ]).stdout.toString();

let watcherId = null,
  previousText = clipboard.readText(),
  previousImage = clipboard.readImage(),
  previousFile = readFile();

clipboard.on = (event, listener) => {
  clipboardEmitter.on(event, listener);
  return clipboard;
};

clipboard.once = (event, listener) => {
  clipboardEmitter.once(event, listener);
  return clipboard;
};

clipboard.off = (event, listener) => {
  if (listener) clipboardEmitter.removeListener(event, listener);
  else clipboardEmitter.removeAllListeners(event);
  return clipboard;
};

clipboard.startWatching = () => {
  if (!watcherId)
    watcherId = setInterval(() => {
      if (isDiffText(previousText, (previousText = clipboard.readText())))
        clipboardEmitter.emit("text-changed");
      if (isDiffImage(previousImage, (previousImage = clipboard.readImage())))
        clipboardEmitter.emit("image-changed");
      if (isDiffFile(previousFile, (previousFile = clipboard.readFile())))
        clipboardEmitter.emit("file-changed");
    }, 500);
  return clipboard;
};

clipboard.stopWatching = () => {
  if (watcherId) clearInterval(watcherId);
  watcherId = null;
  return clipboard;
};

function isDiffText(str1, str2) {
  return str2 && str1 !== str2;
}

function isDiffImage(img1, img2) {
  return !img2.isEmpty() && img1.toDataURL() !== img2.toDataURL();
}

function isDiffFile(file1, file2) {
  return file2 && file1 !== file2;
}

module.exports = clipboard;
