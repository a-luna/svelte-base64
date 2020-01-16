<script>
  import { alert } from "svelma/src/components/Dialog/index.js"
  import FormTitle from "./FormTitle.svelte"
  import EncodeForm from "./EncodeForm.svelte"
  import DecodeForm from "./DecodeForm.svelte"
  import FormResults from "./FormResults.svelte"
  import Visualization from "./Visualization.svelte"
  import LookupTables from "./LookupTables.svelte"

  export let showEncodeForm = true
  let plainInputText = ""
  let encodedInputText = ""
  let outputEncodedText = ""
  let outputDecodedText = ""
  let plainInputTextSelector = ".input-text input"
  let encodedInputTextSelector = ".encoded-text input"
  let submitEncodeFormButtonSelector = ".input-text button"
  let submitDecodeFormButtonSelector = ".encoded-text button"
  let formOptions = {
    inputTextEncoding: "ASCII",
    inputBase64Encoding: "base64url",
    outputBase64Encoding: "base64url",
  }
  let results = {}
  let totalBytesIn = 0
  let totalBytesOut = 0
  let isASCII = true
  let chunks = []

  $: inputText = showEncodeForm ? plainInputText : encodedInputText
  $: outputText = showEncodeForm ? outputEncodedText : outputDecodedText
  $: totalBytesIn =
    formOptions.inputTextEncoding == "ASCII"
      ? plainInputText.length
      : getHexBytes(plainInputText)
  $: inputEncoding = showEncodeForm
    ? formOptions.inputTextEncoding
    : formOptions.inputBase64Encoding
  $: base64Encoding = showEncodeForm
    ? formOptions.outputBase64Encoding
    : formOptions.inputBase64Encoding
  $: outputEncoding = showEncodeForm
    ? formOptions.outputBase64Encoding
    : isASCII
    ? "ASCII"
    : "Hex"
  $: results = {
    showEncodeForm: showEncodeForm,
    inputText: inputText,
    inputEncoding: inputEncoding,
    totalBytesIn: totalBytesIn,
    outputText: outputText,
    outputEncoding: outputEncoding,
    totalBytesOut: totalBytesOut,
    isASCII: isASCII,
  }

  function formToggled(event) {
    clearLastResult()
    showEncodeForm = event.detail.showEncodeForm
    encodedInputText = ""
    plainInputText = ""
  }

  function resetForm() {
    clearLastResult()
    encodedInputText = ""
    plainInputText = ""
    if (showEncodeForm) {
      document.querySelector(plainInputTextSelector).value = ""
    } else {
      document.querySelector(encodedInputTextSelector).value = ""
    }
  }

  function toggleInputStyle(inputIsValid) {
    let plainInputTextElement = document.querySelector(plainInputTextSelector)
    if (plainInputTextElement) {
      plainInputTextElement.classList.toggle("is-primary", inputIsValid)
      plainInputTextElement.classList.toggle("is-danger", !inputIsValid)
    }
    let submitEncodeFormButton = document.querySelector(submitEncodeFormButtonSelector)
    if (submitEncodeFormButton) {
      submitEncodeFormButton.classList.toggle("is-primary", inputIsValid)
      submitEncodeFormButton.classList.toggle("is-danger", !inputIsValid)
    }
    let encodedInputTextElement = document.querySelector(encodedInputTextSelector)
    if (encodedInputTextElement) {
      encodedInputTextElement.classList.toggle("is-primary", inputIsValid)
      encodedInputTextElement.classList.toggle("is-danger", !inputIsValid)
    }
    let submitDecodeFormButton = document.querySelector(submitDecodeFormButtonSelector)
    if (submitDecodeFormButton) {
      submitDecodeFormButton.classList.toggle("is-primary", inputIsValid)
      submitDecodeFormButton.classList.toggle("is-danger", !inputIsValid)
    }
  }

  function formOptionChanged(event) {
    clearLastResult()
    const setting = event.detail.setting
    const value = event.detail.value
    formOptions[setting] = value
  }

  function clearLastResult() {
    toggleInputStyle(true)
    outputEncodedText = ""
    outputDecodedText = ""
    totalBytesOut = 0
    isASCII = true
    chunks = []
  }

  function encodeFormSubmitted(event) {
    let { success, error, encodedData } = event.detail
    toggleInputStyle(success)
    if (success) {
      chunks = encodedData.chunks
      outputEncodedText = encodedData.outputText
      isASCII = encodedData.isASCII
    } else {
      alert({
        message: error,
        title: "Error!",
        type: "is-danger",
      }).then(focusOnElement(plainInputTextSelector))
    }
  }

  function decodeFormSubmitted(event) {
    let { success, error, decodedData } = event.detail
    toggleInputStyle(success)
    if (success) {
      chunks = decodedData.chunks
      outputDecodedText = decodedData.outputText
      totalBytesOut = decodedData.totalBytesOutput
      isASCII = decodedData.isASCII
    } else {
      alert({
        message: error,
        title: "Error!",
        type: "is-danger",
      }).then(focusOnElement(encodedInputTextSelector))
    }
  }

  function focusOnElement(selector) {
    const element = document.querySelector(selector)
    if (element) {
      element.focus()
    }
  }

  function plainInputTextChanged(event) {
    clearLastResult()
    plainInputText = event.detail.plainInputText
  }

  function getHexBytes(hexString) {
    return ignoreHexStringPrefix(hexString).length / 2
  }

  function ignoreHexStringPrefix(hexString) {
    // Remove 0x from beginning of string since this is a valid hex format
    if (/^0x\w+$/.test(hexString)) {
      hexString = hexString.replace(/0x/, "")
    }
    return hexString
  }

  function encodedInputTextChanged(event) {
    clearLastResult()
    encodedInputText = event.detail.encodedInputText
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
  @media screen and (max-width: 660px) {
    .form-group {
      flex: 0 0 53%;
    }
  }
  @media screen and (max-width: 600px) {
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
    <FormTitle on:formToggled={formToggled} on:resetForm={resetForm} />
    {#if showEncodeForm}
      <EncodeForm
        on:formOptionChanged={formOptionChanged}
        on:plainInputTextChanged={plainInputTextChanged}
        on:encodeFormSubmitted={encodeFormSubmitted} />
    {:else}
      <DecodeForm
        on:formOptionChanged={formOptionChanged}
        on:encodedInputTextChanged={encodedInputTextChanged}
        on:decodeFormSubmitted={decodeFormSubmitted} />
    {/if}
  </div>
  <FormResults {...results} />
</div>
<Visualization {chunks} {isASCII} />
<LookupTables {base64Encoding} />
