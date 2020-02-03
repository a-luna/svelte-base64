<script>
  import { createEventDispatcher, onMount } from "svelte"
  import { validateEncodeFormData, b64Encode } from "../base64.js"
  import Field from "svelma/src/components/Field.svelte"
  import Input from "svelma/src/components/Input.svelte"
  import Button from "svelma/src/components/Button.svelte"
  import RadioButtons from "./RadioButtons.svelte"

  const dispatch = createEventDispatcher()
  let inputText = ""
  let inputData = {}
  let inputIsValid = true
  let inputEncoding = "ASCII"
  let outputEncoding = "base64url"
  let errorMessage = ""
  let inputTextBox
  let inputEncodingOptions
  let outputEncodingOptions

  $: buttonType = inputIsValid ? "blue" : "is-danger"

  export const focus = () => inputTextBox.focus()
  export const reset = () => {
    inputText = inputTextBox.value
    inputIsValid = true
    inputEncodingOptions.reset()
    outputEncodingOptions.reset()
    inputEncoding = "ASCII"
    outputEncoding = "base64url"
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

  function outputEncodingChanged(event) {
    outputEncoding = event.detail.value
    inputIsValid = true
    dispatch("outputEncodingChanged", { value: outputEncoding })
  }

  function submitForm() {
    ;[{ inputIsValid, errorMessage }, inputData] = validateEncodeFormData(
      inputText,
      inputEncoding,
      outputEncoding
    )
    if (inputIsValid) {
      let { outputText, chunks } = b64Encode(inputData)
      dispatch("encodingSucceeded", {
        inputText: inputText,
        outputText: outputText,
        chunks: chunks,
      })
    } else {
      dispatch("errorOccurred", { error: errorMessage })
    }
  }

  const inputEncodingOptionDefs = {
    title: "Input Encoding",
    form: "encode-form",
    groupId: "input-encoding",
    groupName: "inputEncoding",
    buttons: [
      {
        label: "ASCII",
        id: "inputEncoding1",
        value: "ASCII",
        checked: true,
      },
      {
        label: "Hex",
        id: "inputEncoding2",
        value: "Hex",
        checked: false,
      },
    ],
  }

  const outputEncodingOptionDefs = {
    title: "Output Encoding",
    form: "encode-form",
    groupId: "output-base64-encoding",
    groupName: "base64EncodingOut",
    buttons: [
      {
        label: "base64",
        id: "base64EncodingOut1",
        value: "base64",
        checked: false,
      },
      {
        label: "base64url",
        id: "base64EncodingOut2",
        value: "base64url",
        checked: true,
      },
    ],
  }
</script>

<style>
  #encode-form {
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-evenly;
    min-height: 120px;
  }
  #encode-form {
    color: #19f5d4;
  }
  .form-options {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-evenly;
    align-items: baseline;
    margin: 0 0 15px;
  }
  .form-input {
    display: flex;
    flex-flow: row nowrap;
  }
  @media screen and (max-width: 670px) {
    #encode-form {
      min-height: 110px;
    }
    .form-options {
      flex-flow: row wrap;
      justify-content: center;
    }
  }
</style>

<svelte:window on:keydown={interceptEnterKey} />

<div id="encode-form" class="form-wrapper">
  <div class="form-options">
    <RadioButtons
      {...inputEncodingOptionDefs}
      bind:this={inputEncodingOptions}
      on:selectionChanged={inputEncodingChanged} />
    <RadioButtons
      {...outputEncodingOptionDefs}
      bind:this={outputEncodingOptions}
      on:selectionChanged={outputEncodingChanged} />
  </div>
  <div class="form-input input-text">
    <div class:is-danger={!inputIsValid} class="field has-addons">
      <div class="control is-expanded">
        <input
          bind:this={inputTextBox}
          on:input={inputTextChanged}
          expanded="true"
          type="text"
          class="input" />
        <p class="control">
          <Button type={buttonType} on:click={submitForm}>Encode</Button>
        </p>
      </div>
    </div>
  </div>
</div>
