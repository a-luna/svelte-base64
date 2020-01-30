<script>
  import { onMount } from "svelte"
  import EncodedChunk from "./EncodedChunk.svelte"
  let showEncodeForm
  let plainTextEncoding
  let outputIsAscii
  let chunks = []

  onMount(() => {
    showEncodeForm = true
    plainTextEncoding = "ASCII"
    outputIsAscii = true
  })

  $: isASCII = showEncodeForm ? plainTextEncoding == "ASCII" : outputIsAscii

  export const update = updatedChunks => chunks = updatedChunks

  export function reset() {
    plainTextEncoding = "ASCII"
    outputIsAscii = true
    chunks = []
  }

  export function handleFormToggled(encodeFormToggled) {
    reset()
    showEncodeForm = encodeFormToggled
  }

  export function handleInputTextChanged() {
    chunks = []
  }

  export function handlePlainTextEncodingChanged(event) {
    if (showEncodeForm) {
      chunks = []
      plainTextEncoding = event.detail.value
    }
  }

  export function handleInputBase64EncodingChanged(event) {
    if (!showEncodeForm) {
      chunks = []
    }
  }

  export function handleOutputIsAsciiChanged(isASCII) {
    if (!showEncodeForm) {
      chunks = []
      outputIsAscii = isASCII
    }
  }
</script>

<style>
  .visualization-wrapper {
    overflow-x: auto;
    overflow-y: hidden;
    margin: 10px auto;
    background-color: #202020;
    border: 1px solid rgba(216, 216, 216, 0.45);
    border-radius: 4px;
    padding: 5px 10px;
  }
  .visualization {
    font-size: 1.3rem;
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    width: auto;
    padding: 5px;
    white-space: nowrap;
  }
  .encoding-key {
    display: flex;
    flex-flow: column nowrap;
    color: #f2f2f2;
    font-weight: 400;
  }
  .input-key {
    margin: 0 0 5px 0;
  }
  .output-key {
    margin: 5px 0 0 0;
  }
  .encoding-map {
    display: flex;
    flex-flow: row nowrap;
  }
  code {
    display: block;
    color: #f2f2f2;
    font-weight: 400;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .hide-element {
    display: none;
  }
</style>

<div class="visualization-wrapper">
  <div class="visualization">
    <div class="encoding-key">
      <div class="input-key">
        <div>
          <code class:hide-element={!isASCII}>ASCII</code>
          <code>Hex</code>
          <code>8-bit</code>
        </div>
      </div>
      <div class="output-key">
        <div>
          <code>6-bit</code>
          <code>Decimal</code>
          <code>Base64</code>
        </div>
      </div>
    </div>
    <div class="encoding-map">
      {#each chunks as chunk}
        <EncodedChunk {chunk} />
      {/each}
    </div>
  </div>
</div>
