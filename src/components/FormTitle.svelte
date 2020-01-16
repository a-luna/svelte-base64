<script>
  import Button from "svelma/src/components/Button.svelte"
  import { createEventDispatcher } from "svelte"
  const dispatch = createEventDispatcher()
  let showEncodeForm = true
  let formTitle = "Encode Text/Data"
  let toggleButtonSelector = ".form-title-buttons .button:first-child"

  function toggleEncodeForm(event) {
    formTitle = "Encode Text/Data"
    showEncodeForm = true
    dispatch("formToggled", { showEncodeForm: true })
  }

  function toggleDecodeForm(event) {
    formTitle = "Decode Base64"
    showEncodeForm = false
    dispatch("formToggled", { showEncodeForm: false })
  }
</script>

<style>
  .form-title-wrapper {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: center;
    line-height: 30px;
    margin: 0 0 5px;
  }
  .form-title {
    flex: 0 0 auto;
    font-size: 2rem;
    font-weight: 400;
    text-align: center;
    letter-spacing: 0.5px;
    cursor: pointer;
    margin: 0 auto;
  }
  .form-title-buttons {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-end;
  }
  @media screen and (max-width: 660px) {
    .form-title {
      font-size: 1.75rem;
    }
  }
  @media screen and (max-width: 600px) {
    .form-title-wrapper {
      margin: 5px 0 0 0;
    }
    .form-title-buttons {
      margin: 0 auto;
    }
    .form-title {
      font-size: 2.2rem;
      font-weight: 400;
    }
  }
  @media screen and (max-width: 452px) {
    .form-title {
      font-size: 2rem;
      font-weight: 400;
    }
  }
  @media screen and (max-width: 400px) {
    .form-title {
      font-size: 1.65rem;
      font-weight: 400;
    }
  }
</style>

<div class="form-title-wrapper">
  <div class="form-title" class:blue={showEncodeForm} class:green={!showEncodeForm}>
    {formTitle}
  </div>
  <div class="form-title-buttons">
    {#if showEncodeForm}
      <Button type="blue" on:click={toggleDecodeForm}>Switch Mode</Button>
    {:else}
      <Button type="green" on:click={toggleEncodeForm}>Switch Mode</Button>
    {/if}
    <Button type="reset" on:click={() => dispatch('resetForm')}>Reset</Button>
  </div>
</div>
