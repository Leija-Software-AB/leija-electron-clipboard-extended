const { clipboard } = require("electron");
const EventEmitter = require("./EventEmitter");
const { spawnSync } = require("child_process");
const clipboardEmitter = new EventEmitter();

/* 
For windows:
Get-Clipboard -Format FileDropList -Raw

Set-Clipboard -Path 'H:\My Documents\linux-basics-1-2-exercises-swedish.pdf' [-Append] 

For linux:

https://github.com/astrand/xclip

For mac:
xclip also?
or perhaps ther automator service?

*/

clipboard.readFile = () => {
  if (process.platform === "win32") {
    return spawnSync("powershell", [
      "-Command",
      "Get-Clipboard -Format FileDropList -Raw",
    ]).stdout.toString();
  } else if (process.platform === "darwin") {
    return spawnSync("");
  } else if (process.platform === "linux") {
    return spawnSync("");
  }
};

clipboard.readFileArray = () =>
  clipboard
    .readFile()
    .split("\r\n")
    .filter((line) => line);

clipboard.writeFile = (path) =>
  spawnSync("powershell", ["-Command", `Set-Clipboard -Path '${path}'`]);

clipboard.writeFileArray = (paths) =>
  spawnSync("powershell", [
    "-Command",
    `Set-Clipboard -Path '${paths.join("', '")}' -Append`,
  ]);

let watcherId = null,
  previousText = clipboard.readText(),
  previousImage = clipboard.readImage(),
  previousFile = clipboard.readFile();

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
