import type { AppContext } from '../context.svelte';

export type UploadActions = {
	onFileChange: (event: Event) => Promise<void>;
	handleDrop: (event: DragEvent) => Promise<void>;
	triggerFileSelect: () => void;
};

export function createUploadActions(context: AppContext): UploadActions {
	const state = context.state;
	const actions = context.actions;

	async function onFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input?.files?.[0];
		if (!file) return;

		await actions.canvas.drawToCanvas(file);
		if (input.files && input.files.length > 0) {
			await actions.palette.uploadAndExtractPalette([...input.files]);
		}
	}

	function triggerFileSelect() {
		if (state.fileInput) {
			state.fileInput.value = '';
			state.fileInput.click();
		}
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		const files = event.dataTransfer?.files;
		if (files?.length) {
			await actions.canvas.drawToCanvas(files[0]);
			await actions.palette.uploadAndExtractPalette([files[0]]);
		}
	}

	return {
		onFileChange,
		handleDrop,
		triggerFileSelect
	};
}
