import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), enhancedImages(), sveltekit()],
	server: {
		fs: {
			allow: [
				'C:/Users/Berat Hündürel/Desktop/Software/Personal/image-to-palette/frontend',
				'C:/Users/BeratHundurel/Desktop/Software/Personal/image-to-palette/frontend'
			]
		}
	}
});
