<script>
  export let showEncodeForm = false
  export let inputText = ""
  export let inputEncoding = ""
  export let totalBytesIn = 0
  export let outputText = ""
  export let outputEncoding = ""
  export let totalBytesOut = 0
  export let isASCII = true

  let inputTextArea
  let outputTextArea

  async function copyInputText() {
    await copyText(inputText, inputTextArea)
  }

  async function copyOutputText() {
    await copyText(outputText, outputTextArea)
  }

  async function copyText(textToCopy, copyableTextArea) {
    const success = await copyTextWithNavigator(textToCopy)
    if (!success) {
      copyableTextArea.select()
      document.execCommand("copy")
    }
  }

  async function copyTextWithNavigator(textToCopy) {
    try {
      result = await navigator.permissions.query({ name: "clipboard-write" })
      if (result.state != "granted" && result.state != "prompt") {
        return false
      }
      await navigator.clipboard.writeText(textToCopy)
      return true
    } catch (e) {
      return false
    }
  }
</script>

<style>
  .results-wrapper {
    flex: 1 1 auto;
  }
  #copyable-input-text,
  #copyable-output-text {
    font-size: 1.4rem;
    font-family: "Roboto Mono", monospace;
    line-height: 16px;
    margin: 0;
    white-space: normal;
    word-break: break-all;
    margin: 0;
    word-break: break-word;
    width: 100%;
    background-color: inherit;
    color: inherit;
    border: none;
    overflow: auto;
    outline: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;
    resize: vertical;
  }
  fieldset {
    border: 1px solid rgba(216, 216, 216, 0.45);
    border-radius: 4px;
    padding: 3px 7px 5px 7px;
    font-size: 1.4rem;
    line-height: 14px;
    min-height: 63px;
    margin: 0 0 10px 0;
  }
  fieldset:last-child {
    margin: 0;
  }
  legend {
    color: #f2f2f2;
    font-weight: 400;
    padding: 0 3px;
  }
  .results-wrapper {
    display: flex;
    flex-flow: column nowrap;
    width: 100%;
  }
  .details-wrapper {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    font-size: 1rem;
    color: #7f7f7f;
    font-weight: 400;
  }
  .encoding,
  .byte-length {
    margin: 2px 5px;
  }
  @media screen and (max-width: 660px) {
    .results-wrapper {
      flex: 0 0 42%;
    }
  }
  @media screen and (max-width: 600px) {
    .results-wrapper {
      flex: 0 0 100%;
      margin: auto;
    }
  }
</style>

<div id="results" class="results-wrapper">
  <fieldset class="results-in" class:blue={showEncodeForm} class:green={!showEncodeForm}>
    <legend>Input</legend>
    <div class="details-wrapper">
      <div class="encoding">Encoding: {inputEncoding}</div>
      {#if showEncodeForm}
        <div class="byte-length">Total Bytes: {totalBytesIn}</div>
      {/if}
    </div>
    <textarea
      id="copyable-input-text"
      readonly
      autoresize
      rows="1"
      bind:value={inputText}
      bind:this={inputTextArea} />
  </fieldset>
  <fieldset class="results-out" class:blue={!showEncodeForm} class:green={showEncodeForm}>
    <legend>Output</legend>
    <div class="details-wrapper">
      <div class="encoding">Encoding: {outputEncoding}</div>
      {#if !showEncodeForm}
        <div class="byte-length">Total Bytes: {totalBytesOut}</div>
      {/if}
    </div>
    <textarea
      id="copyable-output-text"
      readonly
      autoresize
      rows="1"
      bind:value={outputText}
      bind:this={outputTextArea} />
  </fieldset>
</div>
