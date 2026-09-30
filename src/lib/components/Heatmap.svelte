<script lang="ts">
	import { parseDateString } from '$lib/dates';

	let {
		days,
		today,
		class: className = ''
	}: { days: { date: string; words: number }[]; today: string; class?: string } = $props();

	const wordMap = new Map(days.map((d) => [d.date, d.words]));

	// 18 weeks fit narrow screens; 26 on wider ones — render 26, CSS hides the leftmost on small.
	const WEEKS = 26;
	const end = parseDateString(today);
	// Align the last column to today's weekday (weeks start Sunday, like GitHub).
	const endOffset = end.getDay(); // 0=Sun
	const totalDays = WEEKS * 7 - (6 - endOffset);

	const cells: { date: string; words: number | undefined }[] = [];
	for (let i = totalDays - 1; i >= 0; i--) {
		const d = new Date(end);
		d.setDate(d.getDate() - i);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
		cells.push({ date: key, words: wordMap.get(key) });
	}

	const columns = Math.ceil(cells.length / 7);
	const weekdayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
	const topWeekday = cells[0] ? parseDateString(cells[0].date).getDay() : 0;
	const weekdays = Array.from({ length: 7 }, (_, i) => weekdayNames[(topWeekday + i) % 7]);

	const monthLabels = Array.from({ length: columns }, (_, col) => {
		const cell = cells[col * 7];
		if (!cell) return '';
		const d = parseDateString(cell.date);
		const prev = col > 0 ? cells[(col - 1) * 7] : undefined;
		if (prev && parseDateString(prev.date).getMonth() === d.getMonth()) return '';
		return d.toLocaleDateString(undefined, { month: 'short' });
	});

	// Bucket by intensity (0..4).
	function level(words: number | undefined): number {
		if (words === undefined) return 0;
		if (words < 50) return 1;
		if (words < 150) return 2;
		if (words < 300) return 3;
		return 4;
	}

	const color = (words: number | undefined) => {
		const lvl = level(words);
		return [
			'bg-sage-mist/45',
			'bg-sage/25',
			'bg-sage/45',
			'bg-sage/70',
			'bg-sage-deep/90'
		][lvl];
	};
</script>

<div class="{className} select-none" role="img" aria-label="A calendar heatmap of your writing days">
	<div class="overflow-x-auto pb-1">
		<div class="inline-block min-w-full">
			<div class="flex">
				<div class="w-3 shrink-0" aria-hidden="true"></div>
				<div
					class="mb-1 grid gap-[3px]"
					style="grid-template-columns: repeat({columns}, 0.75rem)"
				>
					{#each monthLabels as label, i (i)}
						<span class="font-mono text-[9px] leading-none text-ink-mute">{label}</span>
					{/each}
				</div>
			</div>
			<div class="flex">
				<div class="mr-1 flex w-3 shrink-0 flex-col gap-[3px]" aria-hidden="true">
					{#each weekdays as day, i (i)}
						<span class="flex h-3 items-center font-mono text-[9px] leading-none text-ink-mute">
							{i % 2 === 1 ? day : ''}
						</span>
					{/each}
				</div>
				<div class="grid grid-flow-col grid-rows-7 gap-[3px]">
					{#each cells as cell (cell.date)}
						{@const future = cell.date > today}
						<a
							href="/day/{cell.date}"
							aria-label="{cell.date}{cell.words !== undefined ? `, ${cell.words} words` : ''}"
							class="h-3 w-3 rounded-[3px] transition-all duration-300
								{future ? 'bg-transparent' : color(cell.words)}
								hover:scale-125 hover:ring-2 hover:ring-sage/40"
							style="animation: none;"
							title="{cell.date}{cell.words !== undefined ? ` — ${cell.words} words` : ''}"
						></a>
					{/each}
				</div>
			</div>
		</div>
	</div>
	<div class="mt-2.5 flex items-center justify-between">
		<div class="flex items-center gap-1 text-ink-mute">
			<span class="font-mono text-[10px]">less</span>
			{#each [0, 1, 2, 3, 4] as lvl (lvl)}
				<span class="h-2.5 w-2.5 rounded-[3px] {[ 'bg-sage-mist/45','bg-sage/25','bg-sage/45','bg-sage/70','bg-sage-deep/90'][lvl]}"></span>
			{/each}
			<span class="font-mono text-[10px]">more</span>
		</div>
	</div>
</div>
