import * as path from 'pathe'
import * as vscode from 'vscode'
import type { ImagePair } from '../../../core/compare-images/compare-images.types.ts'
import { getWebviewContent } from './compare-images.webview.ts'

export class ImageComparePanel {
	static currentPanel: ImageComparePanel | undefined

	private readonly panel: vscode.WebviewPanel
	private readonly extensionUri: vscode.Uri
	private readonly disposables: vscode.Disposable[] = []

	constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, images: ImagePair) {
		this.panel = panel
		this.extensionUri = extensionUri

		this.panel.onDidDispose(() => this.dispose(), null, this.disposables)

		void this.update(images)
	}

	async reveal(column: vscode.ViewColumn, images: ImagePair): Promise<void> {
		this.panel.reveal(column)
		await this.update(images)
	}

	private async update(images: ImagePair): Promise<void> {
		const webview = this.panel.webview
		this.panel.title = `Image Comparison: ${path.basename(images[0])} ↔ ${path.basename(images[1])}`
		this.panel.webview.html = await getWebviewContent(webview, this.extensionUri, images)
	}

	private dispose() {
		ImageComparePanel.currentPanel = undefined

		this.panel.dispose()

		while (this.disposables.length) {
			const disposable = this.disposables.pop()
			if (disposable) {
				disposable.dispose()
			}
		}
	}
}

export async function createOrShowImageComparePanel(extensionUri: vscode.Uri, images: ImagePair): Promise<void> {
	const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn! : vscode.ViewColumn.One

	if (ImageComparePanel.currentPanel) {
		await ImageComparePanel.currentPanel.reveal(column, images)
		return
	}

	const webviewRoot = vscode.Uri.joinPath(extensionUri, 'src', 'compare-images', 'webview')

	const panel = vscode.window.createWebviewPanel('imageComparison.compare', 'Image Comparison', column, {
		enableScripts: true,
		localResourceRoots: [
			webviewRoot,
			vscode.Uri.file(path.dirname(images[0])),
			vscode.Uri.file(path.dirname(images[1])),
		],
	})

	ImageComparePanel.currentPanel = new ImageComparePanel(panel, extensionUri, images)
}
