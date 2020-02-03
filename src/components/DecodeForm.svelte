<script>
  import { createEventDispatcher, onMount } from "svelte"
  import { validateDecodeFormData, b64Decode } from "../base64.js"
  import Field from "svelma/src/components/Field.svelte"
  import Input from "svelma/src/components/Input.svelte"
  import Button from "svelma/src/components/Button.svelte"
  import RadioButtons from "./RadioButtons.svelte"

  const dispatch = createEventDispatcher()
  let inputText = ""
  let inputData = {}
  let inputIsValid = true
  let inputEncoding = "base64url"
  let errorMessage = ""
  let inputTextBox
  let inputEncodingOptions

  $: buttonType = inputIsValid ? "green" : "is-danger"

  export const focus = () => inputTextBox.focus()
  export const reset = () => {
    inputText = ""
    inputIsValid = true
    inputEncodingOptions.reset()
  }

  function interceptEnterKey(event) {
    if (event.keyCode == 13 && event.target == inputTextBox) {
      submitForm()
    }
  }

  function inputTextChanged(event) {
    const newValue = event.target.value
    if (inputText != newValue) {
      inputText = newValue
      inputIsValid = true
      dispatch("inputTextChanged", { value: inputText })
    }
  }

  function inputEncodingChanged(event) {
    inputEncoding = event.detail.value
    inputIsValid = true
    dispatch("inputEncodingChanged", { value: inputEncoding })
  }

  function submitForm() {
    ;[{ inputIsValid, errorMessage }, inputData] = validateDecodeFormData(
      inputText,
      inputEncoding
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
  }

  const inputDecodingButtonDefs = {
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

<svelte:window on:keydown={interceptEnterKey} />

<div id="decode-form" class="form-wrapper">
  <div class="form-options">
    <RadioButtons
      {...inputDecodingButtonDefs}
      bind:this={inputEncodingOptions}
      on:selectionChanged={inputEncodingChanged} />
  </div>
  <div class="form-input encoded-text">
    <div class:is-danger={!inputIsValid} class="field has-addons">
      <div class="control is-expanded">
        <input
          bind:this={inputTextBox}
          on:input={inputTextChanged}
          expanded="true"
          type="text"
          class="input" />
        <p class="control">
          <Button type={buttonType} on:click={submitForm}>Decode</Button>
        </p>
      </div>
    </div>
  </div>
</div>
