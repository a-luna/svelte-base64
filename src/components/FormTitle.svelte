<script>
  import Button from "svelma/src/components/Button.svelte"
  import { createEventDispatcher, onMount } from "svelte"

  const dispatch = createEventDispatcher()
  let formTitle = "Encode Text/Data"
  let showEncodeForm = true

  function toggleForm(event) {
    showEncodeForm = !showEncodeForm
    formTitle =
      showEncodeForm
        ? "Encode Text/Data"
        : "Decode Base64"
    dispatch("formToggled", { value: showEncodeForm })
  }
</script>

<style>
  .form-title-wrapper {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: center;
    line-height: 30px;
    margin: 0 0 10px;
  }
  .form-title {
    flex: 0 0 auto;
    font-size: 2rem;
    font-weight: 400;
    text-align: center;
    letter-spacing: 0.5px;
    cursor: pointer;
    margin: 0 5px 0 0;
  }
  .form-title-buttons {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-end;
  }
  @media screen and (max-width: 670px) {
    .form-title-wrapper {
      flex-flow: row nowrap;
      justify-content: space-evenly;
      align-items: center;
      line-height: 30px;
      margin: 0 0 10px;
    }
    .form-title {
      font-size: 2.8rem;
      font-weight: 400;
      margin: 0 auto;
    }
    .form-title-buttons {
      margin: 0 auto;
    }
  }
  @media screen and (max-width: 600px) {
    .form-title-wrapper {
      flex-flow: column nowrap;
    }
    .form-title {
      margin: 0 auto 15px auto;
    }
  }
</style>

<div class="form-title-wrapper">
  <div
    class="form-title"
    class:blue={showEncodeForm}
    class:green={!showEncodeForm}
    on:click={toggleForm}
  >
    {formTitle}
  </div>
  <div class="form-title-buttons">
    {#if showEncodeForm}
      <Button type="blue" on:click={toggleForm}>Switch Mode</Button>
    {:else}
      <Button type="green" on:click={toggleForm}>Switch Mode</Button>
    {/if}
    <Button type="reset" on:click={() => dispatch("resetForm")}>Reset</Button>
  </div>
</div>
