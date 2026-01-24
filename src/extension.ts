import * as path from "path";
import * as vscode from "vscode";

type ImagePair = [vscode.Uri, vscode.Uri];

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    "imageComparison.compareImages",
    async () => {
      const images = await pickTwoImages();
      if (!images) {
        return;
      }

      ImageComparePanel.createOrShow(context.extensionUri, images);
    }
  );

  context.subscriptions.push(command);
}

export function deactivate() {
  // No-op.
}

async function pickTwoImages(): Promise<ImagePair | null> {
  const firstImage = await pickImage("Select the first image");
  if (!firstImage) {
    return null;
  }

  const secondImage = await pickImage("Select the second image");
  if (!secondImage) {
    return null;
  }

  return [firstImage, secondImage];
}

async function pickImage(label: string): Promise<vscode.Uri | null> {
  const selection = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: label,
    filters: {
      Images: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff"]
    }
  });

  if (!selection || selection.length === 0) {
    return null;
  }

  return selection[0];
}

class ImageComparePanel {
  private static currentPanel: ImageComparePanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, images: ImagePair) {
    this.panel = panel;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.update(images);
  }

  static createOrShow(extensionUri: vscode.Uri, images: ImagePair) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn!
      : vscode.ViewColumn.One;

    if (ImageComparePanel.currentPanel) {
      ImageComparePanel.currentPanel.panel.reveal(column);
      ImageComparePanel.currentPanel.update(images);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "imageComparison.compare",
      "Image Comparison",
      column,
      {
        enableScripts: true,
        localResourceRoots: [
          extensionUri,
          vscode.Uri.file(path.dirname(images[0].fsPath)),
          vscode.Uri.file(path.dirname(images[1].fsPath))
        ]
      }
    );

    ImageComparePanel.currentPanel = new ImageComparePanel(panel, images);
  }

  private update(images: ImagePair) {
    const webview = this.panel.webview;
    this.panel.title = `Image Comparison: ${path.basename(
      images[0].fsPath
    )} ↔ ${path.basename(images[1].fsPath)}`;
    this.panel.webview.html = getWebviewContent(webview, images);
  }

  private dispose() {
    ImageComparePanel.currentPanel = undefined;

    this.panel.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

function getWebviewContent(
  webview: vscode.Webview,
  images: ImagePair
): string {
  const leftImage = webview.asWebviewUri(images[0]);
  const rightImage = webview.asWebviewUri(images[1]);
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src ${webview.cspSource} file: data:; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Image Comparison</title>
    <style nonce="${nonce}">
      :root {
        color-scheme: light dark;
        --slider-track: #4c9aff;
        --slider-handle: #ffffff;
        --slider-border: #1b1b1b;
      }

      body {
        margin: 0;
        padding: 24px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background-color: #1e1e1e;
        color: #f3f3f3;
      }

      .container {
        max-width: 100%;
        margin: 0 auto;
      }

      .image-compare {
        position: relative;
        max-width: 100%;
        overflow: hidden;
        border-radius: 8px;
        box-shadow: 0 6px 30px rgba(0, 0, 0, 0.35);
        background-color: #111111;
      }

      .image-compare img {
        display: block;
        width: 100%;
        height: auto;
        pointer-events: none;
        user-select: none;
      }

      .image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 50%;
        overflow: hidden;
      }

      .slider {
        margin-top: 16px;
        width: 100%;
        appearance: none;
        height: 4px;
        border-radius: 999px;
        background: var(--slider-track);
        outline: none;
      }

      .slider::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--slider-handle);
        border: 2px solid var(--slider-border);
        cursor: pointer;
      }

      .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--slider-handle);
        border: 2px solid var(--slider-border);
        cursor: pointer;
      }

      .labels {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: 12px;
        opacity: 0.75;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="image-compare" id="compare">
        <img src="${leftImage}" alt="Left image" />
        <div class="image-overlay" id="overlay">
          <img src="${rightImage}" alt="Right image" />
        </div>
      </div>
      <input
        class="slider"
        id="slider"
        type="range"
        min="0"
        max="100"
        value="50"
        aria-label="Image comparison slider"
      />
      <div class="labels">
        <span>${path.basename(images[0].fsPath)}</span>
        <span>${path.basename(images[1].fsPath)}</span>
      </div>
    </div>
    <script nonce="${nonce}">
      const slider = document.getElementById("slider");
      const overlay = document.getElementById("overlay");

      function updateOverlay(value) {
        overlay.style.width = value + "%";
      }

      slider.addEventListener("input", (event) => {
        const value = event.target.value;
        updateOverlay(value);
      });

      updateOverlay(slider.value);
    </script>
  </body>
</html>`;
}

function getNonce(): string {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i += 1) {
    nonce += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return nonce;
}
