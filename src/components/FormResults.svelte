<script>
  import { createEventDispatcher, onMount } from "svelte"

  let showEncodeForm
  let inputTextArea
  let inputText
  let outputTextArea
  let outputText = ""
  let plainTextEncoding
  let outputBase64Encoding
  let inputBase64Encoding
  let totalBytesOut = 0
  let outputIsAscii

  onMount(() => {
    showEncodeForm = true
    inputText = ""
    plainTextEncoding = "ASCII"
    outputBase64Encoding = "base64url"
    inputBase64Encoding = "base64url"
    outputIsAscii = true
  })

  $: totalBytesIn =
    plainTextEncoding == "ASCII" ? inputText.length : getHexBytes(inputText)

  $: isASCII = showEncodeForm ? plainTextEncoding == "ASCII" : outputIsAscii
  $: inputEncoding = showEncodeForm ? plainTextEncoding : inputBase64Encoding

  $: outputEncoding = showEncodeForm
    ? outputBase64Encoding
    : outputIsAscii
    ? "ASCII"
    : "Hex"

  export function handleFormToggled(encodeFormToggled) {
    reset()
    showEncodeForm = encodeFormToggled
  }

  export function reset() {
    inputText = ""
    plainTextEncoding = "ASCII"
    outputBase64Encoding = "base64url"
    inputBase64Encoding = "base64url"
    outputText = ""
    totalBytesOut = 0
    outputIsAscii = true
  }

  export function handlePlainTextChanged(newValue) {
    clearLastResult()
    if (showEncodeForm) {
      inputText = newValue
    }
  }

  export function handleEncodedTextChanged(newValue) {
    clearLastResult()
    if (!showEncodeForm) {
      inputText = newValue
    }
  }

  export function handlePlainTextEncodingChanged(event) {
    clearLastResult()
    if (showEncodeForm) {
      plainTextEncoding = event.detail.value
    }
  }

  export function handleOutputBase64EncodingChanged(event) {
    clearLastResult()
    if (showEncodeForm) {
      outputBase64Encoding = event.detail.value
    }
  }

  export function handleInputBase64EncodingChanged(event) {
    clearLastResult()
    if (!showEncodeForm) {
      inputBase64Encoding = event.detail.value
    }
  }

  export function handleOutputEncodedTextChanged(outputEncodedText) {
    if (showEncodeForm) {
      outputText = outputEncodedText
    }
  }

  export function handleOutputDecodedTextChanged(outputDecodedText) {
    if (!showEncodeForm) {
      outputText = outputDecodedText
    }
  }

  export const handleTotalBytesOutChanged = totalBytesDecodedOut =>
    (totalBytesOut = totalBytesDecodedOut)

  export function handleOutputIsAsciiChanged(isASCII) {
    if (!showEncodeForm) {
      outputIsAscii = isASCII
    }
  }

  function clearLastResult() {
    outputText = ""
    totalBytesOut = 0
  }

  function getHexBytes(hexString) {
    if (!hexString) return 0
    // Remove 0x from beginning of string since this is a valid hex format
    if (/^0x\w+$/.test(hexString)) {
      hexString = hexString.replace(/0x/, "")
    }
    return hexString.length / 2
  }

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
  @media screen and (max-width: 670px) {
    .results-wrapper {
      flex: 0 0 100%;
      margin: auto;
    }
    fieldset {
      font-size: 1.6rem;
    }
    .details-wrapper {
      font-size: 1.2rem;
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
