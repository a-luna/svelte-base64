<script>
  import { createEventDispatcher, onMount } from "svelte"
  import { validateEncodeFormData, b64Encode } from "../base64.js"
  import Field from "svelma/src/components/Field.svelte"
  import Input from "svelma/src/components/Input.svelte"
  import Button from "svelma/src/components/Button.svelte"
  import RadioButtons from "./RadioButtons.svelte"

  const dispatch = createEventDispatcher()
  let plainTextEncoding = "ASCII"
  let outputBase64Encoding = "base64url"
  let errorMessage = ""
  let inputData = {}
  let inputType = ""
  let buttonType = "blue"
  let plainText = ""
  let inputIsValid = true
  let textBox
  let plainTextEncodingButtons
  let outputBase64EncodingButtons

  export const focus = () => textBox.focus()
  export const reset = () => {
    plainTextEncodingButtons.reset()
    outputBase64EncodingButtons.reset()
    plainTextChanged("", true)
  }

  function handleKeyDown(event) {
    plainTextChanged(event)
    if (event.keyCode == 13) {
      submitEncodeForm()
    }
  }

  function plainTextChanged(event, formReset = false) {
    let newValue = event.target.value
    if (formReset || plainText != newValue) {
      plainText = newValue
      inputIsValid = true
      toggleInputStyle()
      dispatch("plainTextChanged", { value: plainText })
    }
  }

  function plainTextEncodingChanged(event) {
    plainTextEncoding = event.detail.value
    inputIsValid = true
    toggleInputStyle()
    dispatch("plainTextEncodingChanged", { value: plainTextEncoding })
  }

  function outputEncodingChanged(event) {
    outputBase64Encoding = event.detail.value
    inputIsValid = true
    toggleInputStyle()
    dispatch("outputEncodingChanged", { value: outputBase64Encoding })
  }

  function submitEncodeForm() {
    ;[{ inputIsValid, errorMessage }, inputData] = validateEncodeFormData(
      plainText,
      plainTextEncoding,
      outputBase64Encoding
    )
    if (inputIsValid) {
      let { outputText, chunks } = b64Encode(inputData)
      dispatch("encodingSucceeded", { outputText: outputText, chunks: chunks })
    } else {
      dispatch("errorOccurred", { error: errorMessage })
    }
    toggleInputStyle()
  }

  function toggleInputStyle() {
    inputType = inputIsValid ? "" : "is-danger"
    buttonType = inputIsValid ? "blue" : "is-danger"
  }

  const inputEncodingButtons = {
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

  const outputEncodingButtons = {
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

<div id="encode-form" class="form-wrapper">
  <div class="form-options">
    <RadioButtons
      {...inputEncodingButtons}
      bind:this={plainTextEncodingButtons}
      on:selectionChanged={plainTextEncodingChanged} />
    <RadioButtons
      {...outputEncodingButtons}
      bind:this={outputBase64EncodingButtons}
      on:selectionChanged={outputEncodingChanged} />
  </div>
  <div class="form-input input-text">
    <div class:is-danger={!inputIsValid} class="field has-addons">
      <div class="control is-expanded">
        <input
          bind:this={textBox}
          on:input={plainTextChanged}
          on:keyDown={handleKeyDown}
          expanded="true"
          type="text"
          class="input" />
        <p class="control">
          <Button type={buttonType} on:click={submitEncodeForm}>Encode</Button>
        </p>
      </div>
    </div>
  </div>
</div>
