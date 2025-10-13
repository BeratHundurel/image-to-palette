<script lang="ts">
	import Toolbar from '$lib/components/toolbar/Toolbar.svelte';
	import { Toaster } from 'svelte-french-toast';
	import { onMount } from 'svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import UploadOverlay from '$lib/components/UploadOverlay.svelte';
	import PaletteGrid from '$lib/components/PaletteGrid.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import UserProfile from '$lib/components/UserProfile.svelte';
	import Tutorial from '$lib/components/tutorial/Tutorial.svelte';
	import TutorialStart from '$lib/components/tutorial/TutorialStart.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { appStore } from '$lib/stores/app.svelte';
	import TutorialButton from '$lib/components/tutorial/TutorialButton.svelte';

	let showAuthModal = $state(false);

	onMount(async () => {
		await authStore.init();
		await appStore.loadSavedPalettes();
	});

	function openAuthModal() {
		showAuthModal = true;
	}
</script>

<Toaster />

<div class="relative h-[100svh] bg-black text-zinc-300">
	<enhanced:img
		src="../lib/assets/palette.jpg"
		alt="Palette"
		class="absolute top-0 left-0 h-full w-full object-cover"
	/>

	<div class="absolute top-0 left-0 z-10 h-full w-full bg-black/60"></div>

	<div class="absolute top-4 right-4 left-4 z-30">
		<div class="flex flex-row items-center justify-between">
			<TutorialButton />
			{#if authStore.state.isAuthenticated}
				<UserProfile />
			{:else if !authStore.state.isLoading}
				<button
					onclick={openAuthModal}
					class="border-brand/50 hover:shadow-brand flex w-32 cursor-pointer items-center justify-center gap-2 rounded-md border bg-zinc-900 py-2 text-sm font-medium transition-all duration-300 hover:-translate-y-1"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
					<span>Sign In</span>
				</button>
			{/if}
		</div>
	</div>

	<div class="relative z-20 flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden">
		<UploadOverlay />

		<Canvas />

		{#if appStore.state.imageLoaded}
			<Toolbar />
		{/if}

		<PaletteGrid />
	</div>
</div>

<AuthModal bind:isOpen={showAuthModal} />

<!-- Tutorial Components -->
<TutorialStart />
<Tutorial />
