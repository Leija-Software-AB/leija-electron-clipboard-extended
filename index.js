const { clipboard } = require("electron");
const EventEmitter = require("./EventEmitter");
const { spawnSync } = require("child_process");
const clipboardEmitter = new EventEmitter();

clipboard.readFiles = () => {
  if (process.platform === "win32") {
    return spawnSync("powershell", [
      "-Command",
      "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Clipboard -Format FileDropList -Raw",
    ])
      .stdout.toString()
      .split("\r\n")
      .filter((line) => line);
  } else if (process.platform === "darwin") {
    const returnArray = [];
    // check if pbpaste contins a file path
    const clip = clipboard.read("NSFilenamesPboardType");

    if (clip) {
      const lines = clip.split("\n");
      lines.forEach((line) => {
        // Regex match for file path
        if (line.match(/<string>(.*)<\/string>/)) {
          // Remove <string> and </string> from the string
          const filePath = line
            .replace(/<string>(.*)<\/string>/, "$1")
            .replace("\t", "")
            .trim();
          returnArray.push(filePath);
        }
      });
    }
    return returnArray;
  } else {
    throw new Error("Unsupported platform");
  }
};

clipboard.writeFiles = (paths) => {
  if (!Array.isArray(paths)) paths = [paths];

  if (process.platform == "win32") {
    paths.forEach((path) => {
      // check if path is first in iteration
      if (path === paths[0]) {
        spawnSync("powershell", ["-Command", `Set-Clipboard -Path '${path}'`]);
      } else {
        spawnSync("powershell", [
          "-Command",
          `Set-Clipboard -Path '${path}' -Append`,
        ]);
      }
    });
  } else if (process.platform === "darwin") {
    return clipboard.writeBuffer(
      "NSFilenamesPboardType",
      Buffer.from(`
        <?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
        <plist version="1.0">
          <array>
            ${paths.map((path) => `<string>${path}</string>`).join("\n")}
          </array>
        </plist>
      `)
    );
  } else {
    throw new Error("Unsupported platform");
  }
};

let watcherId = null,
  previousText = clipboard.readText(),
  previousImage = clipboard.readImage(),
  previousFile = clipboard.readFiles();

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
      if (isDiffFile(previousFile, (previousFile = clipboard.readFiles())))
        clipboardEmitter.emit("file-changed");
    }, 500);

  clipboard.watcher = watcherId;
  return clipboard;
};

clipboard.stopWatching = () => {
  if (watcherId) clearInterval(watcherId);
  watcherId = null;
  clipboard.watcher = null;
  return clipboard;
};

clipboard.watcher = watcherId;

function isDiffText(str1, str2) {
  return str2 && str1 !== str2;
}

function isDiffImage(img1, img2) {
  return !img2.isEmpty() && img1.toDataURL() !== img2.toDataURL();
}

function isDiffFile(file1, file2) {
  return file2 && file1.toString() !== file2.toString();
}

module.exports = clipboard;
