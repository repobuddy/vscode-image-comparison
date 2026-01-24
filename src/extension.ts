import * as vscode from "vscode";
import { registerCompareImagesCommand } from "./compare-images/compare-images.command";

export function activate(context: vscode.ExtensionContext) {
  registerCompareImagesCommand(context);
}

export function deactivate() {
  // No-op.
}
