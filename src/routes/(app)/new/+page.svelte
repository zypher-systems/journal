<script lang="ts">
	import WritePage from '$lib/components/WritePage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>journal · write</title>
</svelte:head>

<WritePage initial={data.initial} prompt={data.prompt} suggestions={data.suggestions} />
