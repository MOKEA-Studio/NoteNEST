const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");

const API_URL = "http://127.0.0.1:8787/health";
let backendProcess = null;

async function backendIsReady() {
  try {
    const response = await fetch(API_URL);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForBackend(timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await backendIsReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error("NoteNest API did not become ready in time.");
}

async function startBackend() {
  if (await backendIsReady()) return;

  const projectRoot = path.join(__dirname, "..");
  const binary = path.join(projectRoot, "build", "notenest-server");
  const executable = require("node:fs").existsSync(binary) ? binary : "go";
  const args = executable === binary ? [] : ["run", "."];
  const cwd = executable === binary ? projectRoot : path.join(projectRoot, "server");

  backendProcess = spawn(executable, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
  });

  await waitForBackend();
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 760,
    minHeight: 560,
    title: "NoteNest",
    backgroundColor: "#f8f8f5",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const devServer = process.env.VITE_DEV_SERVER_URL;
  if (devServer) {
    window.loadURL(devServer);
  } else {
    window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (error) {
    dialog.showErrorBox("NoteNest를 시작하지 못했습니다", error.message);
    app.quit();
    return;
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  backendProcess?.kill();
});
