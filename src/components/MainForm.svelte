<script>
  import { onMount } from "svelte"
  import { create } from "svelma/src/components/Notification/index.js"
  import FormTitle from "./FormTitle.svelte"
  import EncodeForm from "./EncodeForm.svelte"
  import DecodeForm from "./DecodeForm.svelte"
  import FormResults from "./FormResults.svelte"
  import Visualization from "./Visualization.svelte"
  import LookupTables from "./LookupTables.svelte"

  let showEncodeForm = true
  let encodeForm
  let decodeForm
  let results
  let lookuptables
  let visualization

  function formToggled(event) {
    showEncodeForm = event.detail.value
    results.handleFormToggled(showEncodeForm)
    lookuptables.handleFormToggled(showEncodeForm)
    visualization.handleFormToggled(showEncodeForm)
  }

  function resetForm() {
    if (showEncodeForm) {
      encodeForm.reset()
    } else {
      decodeForm.reset()
    }
    results.reset()
    lookuptables.reset()
    visualization.reset()
  }

  function plainTextChanged(event) {
    results.handlePlainTextChanged(event)
    visualization.handleInputTextChanged()
  }

  function encodedTextChanged(event) {
    results.handleEncodedTextChanged(event)
    visualization.handleInputTextChanged()
  }

  function plainTextEncodingChanged(event) {
    results.handlePlainTextEncodingChanged(event)
    visualization.handlePlainTextEncodingChanged(event)
  }

  function outputBase64EncodingChanged(event) {
    results.handleOutputBase64EncodingChanged(event)
    lookuptables.handleOutputBase64EncodingChanged(event)
  }

  function inputBase64EncodingChanged(event) {
    results.handleInputBase64EncodingChanged(event)
    lookuptables.handleInputBase64EncodingChanged(event)
    visualization.handleInputBase64EncodingChanged()
  }

  function encodingSucceeded(event) {
    let { outputText, chunks } = event.detail
    results.handleOutputEncodedTextChanged(outputText)
    visualization.update(chunks)
  }

  function decodingSucceeded(event) {
    let { outputText, chunks, totalBytesOutput, isASCII } = event.detail
    results.handleOutputDecodedTextChanged(outputText)
    results.handleTotalBytesOutChanged(totalBytesOutput)
    results.handleOutputIsAsciiChanged(isASCII)
    visualization.handleOutputIsAsciiChanged(isASCII)
    visualization.update(chunks)
  }

  function errorOccurred(event) {
    create({
      message: event.detail.error,
      type: "is-warning",
      position: "is-top",
      duration: 3500,
      icon: true,
      showClose: false
    })
    if (showEncodeForm) {
      encodeForm.focus()
    }
    else {
      decodeForm.focus()
    }
  }
</script>

<style>
  .main-form {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    margin: 0 0 15px 0;
  }
  .form-group {
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;
    align-self: flex-start;
    margin: 0 15px auto 0;
    flex: 0 0 340px;
  }
  @media screen and (max-width: 670px) {
    .main-form {
      flex-flow: row wrap;
    }
    .form-group {
      min-height: 0;
      margin: auto auto 15px auto;
    }
    .form-group {
      flex: 0 0 100%;
    }
  }
</style>

<div class="main-form">
  <div class="form-group">
    <FormTitle
      on:formToggled={formToggled}
      on:resetForm={resetForm}
    />
    {#if showEncodeForm}
      <EncodeForm
        bind:this={encodeForm}
        on:plainTextChanged={plainTextChanged}
        on:plainTextEncodingChanged={plainTextEncodingChanged}
        on:outputEncodingChanged={outputBase64EncodingChanged}
        on:encodingSucceeded={encodingSucceeded}
        on:errorOccurred={errorOccurred}
      />
    {:else}
      <DecodeForm
        bind:this={decodeForm}
        on:encodedTextChanged={encodedTextChanged}
        on:inputEncodingChanged={inputBase64EncodingChanged}
        on:decodingSucceeded={decodingSucceeded}
        on:errorOccurred={errorOccurred}
      />
    {/if}
  </div>
  <FormResults bind:this={results} />
</div>
<Visualization bind:this={visualization} />
<LookupTables bind:this={lookuptables} />
