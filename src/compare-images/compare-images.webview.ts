import * as path from "path";
import * as vscode from "vscode";
import { ImagePair } from "./compare-images.types";
import { getNonce } from "../security/security.util";

const webviewTemplatePath = [
  "src",
  "compare-images",
  "webview",
  "compare-images.html"
];

const webviewStylePath = [
  "src",
  "compare-images",
  "webview",
  "compare-images.css"
];

const webviewScriptPath = [
  "src",
  "compare-images",
  "webview",
  "compare-images.js"
];

export async function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  images: ImagePair
): Promise<string> {
  const template = await readTextFile(
    vscode.Uri.joinPath(extensionUri, ...webviewTemplatePath)
  );

  const leftImage = webview.asWebviewUri(images[0]);
  const rightImage = webview.asWebviewUri(images[1]);
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, ...webviewStylePath)
  );
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, ...webviewScriptPath)
  );
  const nonce = getNonce();

  return applyTemplate(template, {
    nonce,
    cspSource: webview.cspSource,
    leftImage: leftImage.toString(),
    rightImage: rightImage.toString(),
    leftLabel: path.basename(images[0].fsPath),
    rightLabel: path.basename(images[1].fsPath),
    styleUri: styleUri.toString(),
    scriptUri: scriptUri.toString()
  });
}

async function readTextFile(uri: vscode.Uri): Promise<string> {
  const data = await vscode.workspace.fs.readFile(uri);
  return new TextDecoder("utf-8").decode(data);
}

function applyTemplate(
  template: string,
  replacements: Record<string, string>
): string {
  return Object.entries(replacements).reduce((current, [key, value]) => {
    return current.split(`{{${key}}}`).join(value);
  }, template);
}
