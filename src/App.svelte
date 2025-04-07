<script>
	import Sidebar from './components/Sidebar.svelte';
	import RightMenu from './components/RightMenu.svelte';
	import Header from './components/Header.svelte';
	import VideoWall from './components/VideoWall.svelte';
	import TableMonitor from './components/TableMonitor.svelte';
	
	let isRecording = false;

	function handleMenuSelect(event) {
		console.log('Selected menu item:', event.detail.id);
	}

	function handleSourceSelect(event) {
		console.log('Selected source:', event.detail.id);
	}

	function handleRecordingToggle(event) {
		isRecording = event.detail.isRecording;
	}

	function handleSourceAdded(event) {
		console.log('Source added:', event.detail);
	}
</script>

<main>
	<Sidebar 
		on:menuSelect={handleMenuSelect}
		on:sourceSelect={handleSourceSelect}
	/>
	<div class="content">
		<Header {isRecording} />
		<div class="main-content">
			<div class="video-wall-section">
				<VideoWall on:sourceAdded={handleSourceAdded} />
			</div>
			<div class="monitor-section">
				<TableMonitor />
			</div>
		</div>
	</div>
	<RightMenu 
		on:recordingToggle={handleRecordingToggle}
	/>
</main>

<style>
	main {
		display: flex;
		width: 100%;
		max-height: 100vh;
		position: relative;
		background-color: #f5f5f5;
	}
	
	.content {
		overflow-y: auto;
		flex: 1;
		padding: 1rem;
		background-color: #f5f5f5;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-x: hidden;
	}

	.main-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.video-wall-section {
		background: #1a1a1a;
		border-radius: 8px;
		overflow: hidden;
		min-height: 70vh;
	}

	.monitor-section {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		min-height: 30vh;
	}

	/* Custom Scrollbar Styles */
	:global(::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(::-webkit-scrollbar-track) {
		background: #f1f1f1;
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: #888;
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: #555;
	}

	/* Firefox Scrollbar */
	:global(*) {
		scrollbar-width: thin;
		scrollbar-color: #888 #f1f1f1;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
			Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		background-color: #000;
		color: #fff;
		overflow: hidden;
	}
</style>