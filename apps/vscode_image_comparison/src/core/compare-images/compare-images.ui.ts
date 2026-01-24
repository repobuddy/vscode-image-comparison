export type CompareImagesTemplateData = {
	nonce: string
	cspSource: string
	leftImage: string
	rightImage: string
	leftLabel: string
	rightLabel: string
	styleUri: string
	scriptUri: string
}

export function renderCompareImagesTemplate(template: string, data: CompareImagesTemplateData): string {
	return Object.entries(data).reduce((current, [key, value]) => {
		return current.split(`{{${key}}}`).join(value)
	}, template)
}
