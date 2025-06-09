<!-- Draggable.svelte -->
<script lang="ts">
	export let left = 100;
	export let top = 100;
	let moving = false;
	let dragHandle: HTMLElement;

	function onMouseDown(e: MouseEvent) {
		// Only allow dragging from the grip area
		if (dragHandle && dragHandle.contains(e.target as Node)) {
			moving = true;
			e.preventDefault();
		}
	}

	function onMouseMove(e: MouseEvent) {
		if (moving) {
			left += e.movementX;
			top += e.movementY;
		}
	}

	function onMouseUp() {
		moving = false;
	}
</script>

<section
	role="toolbar"
	tabindex="-1"
	on:mousedown={onMouseDown}
	style="left: {left}px; top: {top}px;"
	class="draggable {moving ? 'dragging' : ''}"
>
	<div class="toolbar-container">
		<!-- Draggable Grip Handle -->
		<div 
			bind:this={dragHandle}
			class="drag-handle"
		>
			<div class="grip-lines">
				<div class="grip-line grip-line-1"></div>
				<div class="grip-line grip-line-2"></div>
				<div class="grip-line grip-line-3"></div>
			</div>
		</div>

		<!-- Action List -->
		<div class="actions-container">
			<ul class="actions-list">
				{#each Array(8) as _, i}
					<li class="action-item">
						<button class="action-button" aria-label="Tool {i + 1}">
							<span class="action-icon">T</span>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>

<svelte:window on:mouseup={onMouseUp} on:mousemove={onMouseMove} />

<style>
	.draggable {
		user-select: none;
		position: absolute;
		z-index: 50;
		filter: drop-shadow(0 20px 25px rgb(0 0 0 / 0.15)) drop-shadow(0 8px 10px rgb(0 0 0 / 0.04));
		transition: filter 0.2s ease;
	}

	.draggable.dragging {
		filter: drop-shadow(0 25px 50px rgb(0 0 0 / 0.25)) drop-shadow(0 12px 20px rgb(0 0 0 / 0.08));
	}

	.toolbar-container {
		background: rgba(24, 24, 27, 0.95);
		backdrop-filter: blur(16px);
		border-radius: 16px;
		border: 1px solid rgba(63, 63, 70, 0.3);
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.draggable:hover .toolbar-container {
		border-color: rgba(63, 63, 70, 0.5);
		background: rgba(24, 24, 27, 0.98);
	}

	.drag-handle {
		padding: 12px 16px 8px 16px;
		cursor: move;
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(to bottom, rgba(39, 39, 42, 0.3), rgba(24, 24, 27, 0.1));
		border-bottom: 1px solid rgba(63, 63, 70, 0.2);
		transition: background 0.2s ease;
	}

	.drag-handle:hover {
		background: linear-gradient(to bottom, rgba(39, 39, 42, 0.5), rgba(24, 24, 27, 0.2));
	}

	.grip-lines {
		display: flex;
		flex-direction: column;
		gap: 2px;
		align-items: center;
	}

	.grip-line {
		height: 2px;
		border-radius: 1px;
		background: rgba(161, 161, 170, 0.6);
		transition: all 0.2s ease;
	}

	.grip-line-1 { width: 24px; }
	.grip-line-2 { width: 20px; }
	.grip-line-3 { width: 16px; }

	.drag-handle:hover .grip-line {
		background: rgba(161, 161, 170, 0.8);
	}

	.dragging .grip-line {
		background: rgba(161, 161, 170, 1);
	}

	.actions-container {
		padding: 12px;
	}

	.actions-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-height: 300px;
		overflow-y: auto;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.actions-list::-webkit-scrollbar {
		width: 4px;
	}

	.actions-list::-webkit-scrollbar-track {
		background: rgba(39, 39, 42, 0.3);
		border-radius: 2px;
	}

	.actions-list::-webkit-scrollbar-thumb {
		background: rgba(161, 161, 170, 0.3);
		border-radius: 2px;
	}

	.actions-list::-webkit-scrollbar-thumb:hover {
		background: rgba(161, 161, 170, 0.5);
	}

	.action-item {
		display: flex;
	}

	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 12px;
		background: rgba(39, 39, 42, 0.8);
		border: 1px solid rgba(63, 63, 70, 0.3);
		color: white;
		font-weight: 600;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s ease;
		outline: none;
	}

	.action-button:hover {
		background: rgba(63, 63, 70, 0.8);
		border-color: rgba(82, 82, 91, 0.5);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.action-button:active {
		transform: translateY(0);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
	}

	.action-button:focus-visible {
		outline: 2px solid rgba(147, 197, 253, 0.8);
		outline-offset: 2px;
	}

	.action-icon {
		pointer-events: none;
	}

	/* Smooth dragging animation */
	.draggable:not(.dragging) {
		transition: left 0.1s ease-out, top 0.1s ease-out;
	}
</style>