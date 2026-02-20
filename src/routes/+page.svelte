
<script>
import { page } from '$app/stores';
</script>

<h1>Welcome, {$page.data.name}!</h1>
<p>Welcome to the Quiz Game!</p>

<div>
    <div class = 'questions'>
        <div class = 'question'>
            <p>Question 1: What is the capital of France?</p>
            <p>Question 2: Who wrote "To Kill a Mockingbird"?</p>
            <p>Question 3: What is the largest planet in our solar system?</p>
        </div>
    </div>
    <div class = 'options'>
        <button>Option 1</button>
        <button>Option 2</button>
        <button>Option 3</button>
        <button>Option 4</button>
    </div>
</div>



<style>


</style>