import * as vscode from 'vscode'
import { pickTwoImages } from '../image-picker/image-picker.ts'
import { createOrShowImageComparePanel } from './compare-images.panel.ts'

export function registerCompareImagesCommand(context: vscode.ExtensionContext): void {
	const command = vscode.commands.registerCommand('imageComparison.compareImages', async () => {
		const images = await pickTwoImages()
		if (!images) {
			return
		}

		await createOrShowImageComparePanel(context.extensionUri, images)
	})

	context.subscriptions.push(command)
}
