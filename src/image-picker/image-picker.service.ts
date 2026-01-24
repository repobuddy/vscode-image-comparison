import * as vscode from 'vscode'
import type { ImagePair } from '../compare-images/compare-images.types.ts'

export async function pickTwoImages(): Promise<ImagePair | null> {
	const firstImage = await pickImage('Select the first image')
	if (!firstImage) {
		return null
	}

	const secondImage = await pickImage('Select the second image')
	if (!secondImage) {
		return null
	}

	return [firstImage, secondImage]
}

async function pickImage(label: string): Promise<vscode.Uri | null> {
	const selection = await vscode.window.showOpenDialog({
		canSelectMany: false,
		openLabel: label,
		filters: {
			Images: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff'],
		},
	})

	if (!selection || selection.length === 0) {
		return null
	}

	return selection[0]
}
