<script>
	import '../app.css';
	let { children } = $props();
</script>

<div class="fixed inset-0 -z-10 overflow-hidden">
	<!-- Grid Pattern -->
	<div
		class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]"
	></div>
</div>

<div class="min-h-screen w-full flex items-center justify-center">
	{@render children()}
</div>

<style>
	:global(body) {
		background-color: black;
		color: white;
	}
</style>
