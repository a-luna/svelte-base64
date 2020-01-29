<script>
  import { createEventDispatcher, onMount } from "svelte"
  import { validateDecodeFormData, b64Decode } from "../base64.js"
  import Field from "svelma/src/components/Field.svelte"
  import Input from "svelma/src/components/Input.svelte"
  import Button from "svelma/src/components/Button.svelte"
  import RadioButtons from "./RadioButtons.svelte"

  const dispatch = createEventDispatcher()
  let inputBase64Encoding = "base64url"
  let errorMessage = ""
  let inputData = {}
  let inputType = ""
  let buttonType = "green"
  let encodedTextBinding = ""
  let encodedText = ""
  let inputIsValid = true
  let textBox

  $: encodedTextChanged(encodedTextBinding)

  export const focus = () => textBox.focus()
  export const reset = () => {
    encodedTextBinding = ""
    encodedTextChanged("", true)
  }

  function handleEncodedTextChanged(event) {
    encodedTextChanged(event.target.value)
    if (event.keyCode == 13) {
      submitDecodeForm()
    }
  }

  function encodedTextChanged(newValue, formReset=false) {
    if (formReset || encodedText != event.target.value) {
      encodedText = newValue
      inputIsValid = true
      toggleInputStyle()
      dispatch("encodedTextChanged", { value: encodedText })
    }
  }

  function inputEncodingChanged(event) {
    inputBase64Encoding = event.detail.value
    dispatch("inputEncodingChanged", { value: inputBase64Encoding })
  }

  function submitDecodeForm() {
    [{ inputIsValid, errorMessage }, inputData] = validateDecodeFormData(
      encodedText,
      inputBase64Encoding
    )
    if (inputIsValid) {
      let { chunks, outputText, totalBytesOutput, isASCII } = b64Decode(inputData)
      dispatch("decodingSucceeded", {
        outputText: outputText,
        chunks: chunks,
        totalBytesOutput: totalBytesOutput,
        isASCII: isASCII,
      })
    } else {
      dispatch("errorOccurred", { error: errorMessage })
    }
    toggleInputStyle()
  }

  function toggleInputStyle() {
    inputType = inputIsValid ? "" : "is-danger"
    buttonType = inputIsValid ? "green" : "is-danger"
  }

  const inputDecodingButtons = {
    title: "Input Encoding",
    form: "decode-form",
    groupId: "input-base64-encoding",
    groupName: "base64EncodingIn",
    buttons: [
      {
        label: "base64",
        id: "base64EncodingIn1",
        value: "base64",
        checked: false,
      },
      {
        label: "base64url",
        id: "base64EncodingIn2",
        value: "base64url",
        checked: true,
      },
    ],
  }
</script>

<style>
  #decode-form {
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-evenly;
    min-height: 120px;
  }
  #decode-form {
    color: #7fff6e;
  }
  .form-options {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-evenly;
    align-items: baseline;
    margin: 0 0 25px;
  }
  .form-input {
    display: flex;
    flex-flow: row nowrap;
  }
  @media screen and (max-width: 670px) {
    #decode-form {
      min-height: 110px;
    }
    .form-options {
      margin: 0 0 15px 0;
    }
  }
  @media screen and (max-width: 400px) {
    .form-options {
      justify-content: center;
    }
  }
</style>

<div id="decode-form" class="form-wrapper">
  <div class="form-options">
    <RadioButtons
      {...inputDecodingButtons}
      on:selectionChanged={inputEncodingChanged} />
  </div>
  <div class="form-input encoded-text">
    <div class:is-danger={!inputIsValid} class="field has-addons">
      <div class="control is-expanded">
        <input
          bind:this={textBox}
          bind:value={encodedTextBinding}
          on:input={handleEncodedTextChanged}
          expanded="true"
          type="text"
          class="input"
        >
        <p class="control">
        <Button type={buttonType} on:click={submitDecodeForm}>
          Encode
        </Button>
        </p>
      </div>
    </div>
  </div>
</div>
