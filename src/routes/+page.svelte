<script>
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { page } from '$app/state';

	let posts = $state([]);
	let loading = $state(false);
	let Curpage = $state(1);
	let container;
	let loadingPosts = $state(false);
	let loadingImages = $state(new Set());
	let currentPostIndex = $state(0);
	let showDashboard = $state(false);
	let likedPosts = $state([]);
	let lastScrollTop = $state(0);
	let isNavHidden = $state(false);
    let hasReturned = $state(false)
	let inactivityTimeout;

	$effect(() => {
		if (!showDashboard && hasReturned) {
         
			scrollToLastPosition()
		}
	});

	function resetInactivityTimer() {
		// Clear existing timeout
		clearTimeout(inactivityTimeout);

		// Set new timeout
		inactivityTimeout = setTimeout(() => {
			isNavHidden = false;
		}, 1000); // 3 seconds
	}

	function preloadImage(imageUrl) {
		return new Promise((resolve, reject) => {
			loadingImages.add(imageUrl);
			loadingImages = loadingImages; // Trigger reactivity

			const img = new Image();
			img.src = imageUrl;
			img.onload = () => {
				loadingImages.delete(imageUrl);
				loadingImages = loadingImages; // Trigger reactivity
				resolve();
			};
			img.onerror = () => {
				loadingImages.delete(imageUrl);
				loadingImages = loadingImages; // Trigger reactivity
				reject();
			};
		});
	}

	async function loadMorePosts() {
		if (loading || showDashboard) return;

		loading = true;
		try {
			// Simulate loading new posts with placeholder images
            const lastId = currentPostIndex
			let newPosts = [];

			for (let i = 0; i < 5; i++) {
				let res = await fetch('https://api.waifu.im/search');
				let json = await res.json();
				newPosts.push({
					imageUrl: json.images[0].url,
					loaded: false,
					isLiked: false,
					showHeartAnimation: false,
					dominantColor: json.images[0].dominant_color,
					showDislikeAnimation: false
				});
			}

			await Promise.all(
				newPosts.map((post) =>
					preloadImage(post.imageUrl)
						.then(() => {
							post.loaded = true;
						})
						.catch(() => {
							post.loaded = false;
						})
				)
			);


			posts = [...posts, ...newPosts];
			Curpage += 1;
            currentPostIndex = lastId
		} catch (error) {
			console.error('Error loading posts:', error);
		} finally {
			loading = false;
		}
	}

	function handleScroll(event) {
		const currentScroll = hasReturned ? lastScrollTop : event.target.scrollTop;
		resetInactivityTimer();

		// Determine scroll direction
		if (currentScroll > lastScrollTop) {
			// Scrolling down
			isNavHidden = true;
		} else {
			// Scrolling up
			isNavHidden = false;
		}

		if (!showDashboard) {
			lastScrollTop = currentScroll;
        
		}
		// Calculate which post is currently in view
		const containerHeight = window.innerHeight;
		const scrollTop = event.target.scrollTop;
		const newIndex = Math.floor((scrollTop + containerHeight / 2) / containerHeight);
		if (!showDashboard && !hasReturned) {
			if (newIndex !== currentPostIndex) {
				currentPostIndex = newIndex;
			}
		}

		// Load more posts when near the end
		const bottom =
			event.target.scrollHeight - event.target.scrollTop <= event.target.clientHeight * 1.5;
		if (bottom) {
			loadMorePosts();
		}
	}

	function scrollToLastPosition() {
		const posts = document.querySelectorAll('article');
        console.log(currentPostIndex)
		if (posts[currentPostIndex]) {
			posts[currentPostIndex].scrollIntoView({ behavior: 'instant' });
		}
	}

	function toggleDashboard(show) {
   
		showDashboard = show;
        if (!show) {
            hasReturned = true 
            setTimeout(() => {
                hasReturned = false 
            }, 100)
        }
		// // If returning to feed, wait for render then scroll
		// if (!show) {
		// 	setTimeout(() => {

		// 		container.scrollTop = currentScroll

		//         console.log(container.scrollTop)
		// 	}, 50); // Small delay to ensure content is rendered
		// }
	}

	function handleDoubleClick(post) {
		if (post.showDislikeAnimation || post.showHeartAnimation) return;
		post.isLiked = !post.isLiked;

		if (post.isLiked) {
			post.showHeartAnimation = true;
		} else {
			post.showDislikeAnimation = true;
		}

		let new_likedPosts = posts.filter((post) => post.isLiked).map((post) => post.imageUrl);
		likedPosts = [...likedPosts, ...new_likedPosts];

		localStorage.setItem(
			'liked-posts',
			JSON.stringify({
				liked: likedPosts
			})
		);

		// Reset heart animation after it completes
		setTimeout(() => {
			post.showHeartAnimation = false;
			post.showDislikeAnimation = false;
			posts = posts;
		}, 1000);
	}

	async function handleDownload(imageSrc) {
		const image = await fetch(imageSrc);
		const imageBlog = await image.blob();
		const imageURL = URL.createObjectURL(imageBlog);

		const link = document.createElement('a');
		link.href = imageURL;
		link.download = `Daily Hentai ${imageSrc}`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	onMount(() => {
		try {
			likedPosts = JSON.parse(localStorage.getItem('liked-posts'))?.liked || [];
		} catch (err) {
			likedPosts = [];
		}

		resetInactivityTimer();
		loadMorePosts();

		return () => {
			clearTimeout(inactivityTimeout);
		};
	});
</script>

<div class="min-h-screen bg-transparent text-white overflow-hidden">
	<main
		bind:this={container}
		class="h-screen overflow-y-scroll snap-y snap-mandatory"
		onscroll={handleScroll}
	>
		{#if loading && !showDashboard}
			<div class="absolute left-[44vw] top-[47vh] h-24 z-[100]" transition:scale>
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-white"></div>
			</div>
		{/if}
		{#if showDashboard}
			<div class="container mx-auto px-4 pt-[4rem] pb-8" transition:fade>
				<h2 class="text-2xl font-bold mb-6">Your Liked Posts</h2>

				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{#each likedPosts as post}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div class="relative aspect-square rounded-lg overflow-hidden group">
							<button
								aria-label="download"
								class="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all duration-200"
								onclick={() => handleDownload(post)}
							>
								<svg
									class="w-6 h-6 text-white"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
									<polyline points="7 10 12 15 17 10" />
									<line x1="12" y1="15" x2="12" y2="3" />
								</svg>
							</button>

							<img src={post} alt="d" class="w-full h-full object-cover" />
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div transition:fade={{ duration: 120 }}>
				{#each posts as post}
					{#if post.loaded}
						<article
							class="h-screen snap-start snap-always flex flex-col px-6 pt-8 pb-6"
							transition:fade
						>
							<div
								class="relative flex-1 flex flex-col bg-black rounded-lg bg-transparent shadow-lg"
							>
								<!-- Download button -->
								<div
									class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] blur-[100px] -z-[5]"
									style="background-color: {post.dominantColor};"
								></div>
								<button
									aria-label="download"
									class="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all duration-200"
									onclick={() => handleDownload(post.imageUrl)}
								>
									<svg
										class="w-6 h-6 text-white"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
										<polyline points="7 10 12 15 17 10" />
										<line x1="12" y1="15" x2="12" y2="3" />
									</svg>
								</button>

								

								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="relative flex-1 cursor-pointer"
									ondblclick={() => handleDoubleClick(post)}
								>
									<img
										src={post.imageUrl}
										alt={post.title}
										class="w-full h-full object-cover rounded-lg transition-all duration-300"
										class:animate-post={post.showHeartAnimation}
										class:opacity-50={loading}
									/>

									{#if post.showHeartAnimation || post.showDislikeAnimation}
										<div
											class="absolute inset-0 flex items-center justify-center text-red-400 transition-all duration-300"
											in:scale={{ duration: 300, start: 0.5 }}
											out:scale={{ duration: 300, start: 1 }}
										>
											<svg
												class="h-20 w-20 transition-colors duration-200 {post.isLiked
													? 'text-red-500 filter drop-shadow-heart'
													: 'text-white hover:text-red-500'}"
												class:animate-dislike={!post.isLiked}
												class:animate-heart={post.isLiked}
												viewBox="0 0 24 24"
												fill="currentColor"
												stroke="currentColor"
												stroke-width="2"
											>
												<path
													d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
												/>
											</svg>
										</div>
									{/if}
								</div>
							</div>
						</article>
					{/if}
				{/each}
			</div>
		{/if}
	</main>
	<nav
		class="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t-2 border-l border-r border-white/30 rounded-t-[3rem] px-4 py-2 transition-transform duration-300 ease-in-out"
		class:translate-y-full={isNavHidden && !showDashboard}
	>
		<div class="max-w-md mx-auto">
			<ul class="flex justify-around items-center">
				<li class="flex-1">
					<button
						onclick={() => toggleDashboard(false)}
						class="ml-20 flex flex-col items-center p-2 text-sm transition-colors duration-200 focus:outline-none"
						class:text-white={!showDashboard}
						class:text-gray-400={showDashboard}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16m-7 6h7"
							/>
						</svg>
						<span class="mt-1 text-xs font-medium">Feed</span>
					</button>
				</li>
				<li class="flex-1">
					<button
						onclick={() => toggleDashboard(true)}
						class="ml-20 flex flex-col items-center p-2 text-sm transition-colors duration-200 focus:outline-none"
						class:text-red-500={showDashboard}
						class:text-gray-400={!showDashboard}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
							/>
						</svg>
						<span class="mt-1 text-xs font-medium">Liked</span>
					</button>
				</li>
			</ul>
		</div>
	</nav>
</div>

<style>
	/* Hide scrollbar but keep functionality */
	main {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	main::-webkit-scrollbar {
		display: none;
	}

	/* Heart animation */
	.animate-heart {
		animation: heart 1s ease-in-out forwards;
	}

	.animate-dislike {
		animation: dislike 1s ease-in-out forwards;
	}

	.animate-post {
		animation: post 0.3s ease-in-out forwards;
	}

	@keyframes post {
		0% {
			transform: scale(1);
			filter: blur(0px);
		}

		50% {
			transform: scale(0.9);
			filter: blur(2px);
		}

		80% {
			filter: blur(1px);
		}

		100% {
			transform: scale(1);
			filter: blur(0px);
		}
	}

	@keyframes heart {
		0% {
			opacity: 0;
			transform: scale(0.5);
		}
		15% {
			opacity: 1;
			transform: scale(1.4) rotateZ(-5deg);
		}
		30% {
			transform: scale(0.95);
		}
		45% {
			transform: scale(1);
		}
		80% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: scale(1) rotate(0);
		}
	}

	@keyframes dislike {
		0% {
			opacity: 1;
			transform: scale(1);
		}

		100% {
			opacity: 0;
			transform: scale(0);
		}
	}
	.drop-shadow-heart {
		filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.5));
	}

	/* Additional glow for animated heart */
	.animate-heart.drop-shadow-heart {
		filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.7));
	}
	nav {
		transform-origin: bottom;
		will-change: transform;
	}
</style>
