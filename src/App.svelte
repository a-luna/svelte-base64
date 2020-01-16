<script>
  import MainForm from "./components/MainForm.svelte"
</script>

<style>
	main {
		position: relative;
		max-width: 56em;
		background-color: #202020;
		padding: 2em;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>

<svelte:head>
  <title>Base64 Visualizer</title>
  <link rel='stylesheet' href='global.css'>
</svelte:head>

<main>
  <MainForm />
</main>
