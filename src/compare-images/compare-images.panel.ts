import * as path from "path";
import * as vscode from "vscode";
import { ImagePair } from "./compare-images.types";
import { getWebviewContent } from "./compare-images.webview";

export class ImageComparePanel {
  private static currentPanel: ImageComparePanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    images: ImagePair
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    void this.update(images);
  }

  static async createOrShow(
    extensionUri: vscode.Uri,
    images: ImagePair
  ): Promise<void> {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn!
      : vscode.ViewColumn.One;

    if (ImageComparePanel.currentPanel) {
      ImageComparePanel.currentPanel.panel.reveal(column);
      await ImageComparePanel.currentPanel.update(images);
      return;
    }

    const webviewRoot = vscode.Uri.joinPath(
      extensionUri,
      "src",
      "compare-images",
      "webview"
    );

    const panel = vscode.window.createWebviewPanel(
      "imageComparison.compare",
      "Image Comparison",
      column,
      {
        enableScripts: true,
        localResourceRoots: [
          webviewRoot,
          vscode.Uri.file(path.dirname(images[0].fsPath)),
          vscode.Uri.file(path.dirname(images[1].fsPath))
        ]
      }
    );

    ImageComparePanel.currentPanel = new ImageComparePanel(
      panel,
      extensionUri,
      images
    );
  }

  private async update(images: ImagePair): Promise<void> {
    const webview = this.panel.webview;
    this.panel.title = `Image Comparison: ${path.basename(
      images[0].fsPath
    )} ↔ ${path.basename(images[1].fsPath)}`;
    this.panel.webview.html = await getWebviewContent(
      webview,
      this.extensionUri,
      images
    );
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
