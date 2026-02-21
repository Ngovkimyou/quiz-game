<script lang="ts">
import {UpdateScore} from '$lib/components/updateScore';

import {onMount} from 'svelte';

const {data} = $props();
console.log("@leaderboard(+page.svelte): ",data.columns);
console.log("@leaderboard(+page.svelte): ",data.rows);
function doUpdate(id:string, score: number) {
    UpdateScore(id, score)
}
onMount(() => {
    //
}); 



</script>

<h1>Leaderboard</h1>
<div class = 'leaderboard_box'>
    <p>Here is the leaderboard of the quiz game. The top players are listed below:</p>
    <ul class="leaderboard_list">
        {#each data.rows as row}
            <li>{row.name}: {row.score} points, time: {row.registered_date}</li>
        {/each}
    </ul>
    <button onclick = {() => doUpdate("2",1000000)}> Update </button>
</div>

<style>
    .leaderboard_box {
        border: 1px solid #ccc;
        padding: 1rem;
        border-radius: 4px;
        max-width: 400px;
        margin: 0 auto;
    }
    .leaderboard_list {
        list-style-type: decimal;
        padding-left: 1.5rem;
    }
    /* .leaderboard_list li {
        margin-bottom: 0.5rem;
    } */
</style>