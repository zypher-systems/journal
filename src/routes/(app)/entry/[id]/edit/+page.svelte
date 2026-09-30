<script lang="ts">
	import WritePage from '$lib/components/WritePage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>journal · edit</title>
</svelte:head>

<WritePage initial={data.initial} suggestions={data.suggestions} />
