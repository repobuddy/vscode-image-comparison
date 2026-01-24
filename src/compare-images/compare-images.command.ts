import * as vscode from "vscode";
import { pickTwoImages } from "../image-picker/image-picker.service";
import { ImageComparePanel } from "./compare-images.panel";

export function registerCompareImagesCommand(
  context: vscode.ExtensionContext
): void {
  const command = vscode.commands.registerCommand(
    "imageComparison.compareImages",
    async () => {
      const images = await pickTwoImages();
      if (!images) {
        return;
      }

      await ImageComparePanel.createOrShow(context.extensionUri, images);
    }
  );

  context.subscriptions.push(command);
}
