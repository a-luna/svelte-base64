<script>
  import RadioButtons from "./RadioButtons.svelte"
  import Field from "svelma/src/components/Field.svelte"
  import Input from "svelma/src/components/Input.svelte"
  import Button from "svelma/src/components/Button.svelte"
  import { validateEncodeFormData, b64Encode } from "../helpers/base64.js"
  import { createEventDispatcher, onMount } from "svelte"
  const dispatch = createEventDispatcher()

  let inputTextEncoding = "ASCII"
  let outputBase64Encoding = "base64url"
  let plainInputTextSelector = ".input-text input"

  onMount(() => {
    document.querySelector(plainInputTextSelector)
    addEventListener("keyup", handlePlainTextInputChanged)
  })

  function handlePlainTextInputChanged(event) {
    if (event.keyCode == 13) {
      submitEncodeForm()
    } else {
      plainInputTextChanged(event)
    }
  }

  function plainInputTextChanged(event) {
    dispatch("plainInputTextChanged", { plainInputText: event.target.value })
  }

  function submitEncodeForm() {
    let plainInputText = document.querySelector(plainInputTextSelector).value
    let [{ success, error }, inputData] = validateEncodeFormData(
      plainInputText,
      inputTextEncoding,
      outputBase64Encoding
    )
    if (success) {
      let encodedData = b64Encode(inputData)
      dispatch("encodeFormSubmitted", {
        success: true,
        error: "",
        encodedData: encodedData,
      })
    } else {
      dispatch("encodeFormSubmitted", { success: false, error: error, encodedData: {} })
    }
  }

  function inputTextEncodingChanged(event) {
    inputTextEncoding = event.detail.value
    dispatch("formOptionChanged", {
      setting: "inputTextEncoding",
      value: inputTextEncoding,
    })
  }

  function outputBase64EncodingChanged(event) {
    outputBase64Encoding = event.detail.value
    dispatch("formOptionChanged", {
      setting: "outputBase64Encoding",
      value: outputBase64Encoding,
    })
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
    justify-content: space-between;
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
    margin: auto 0 20px 0;
  }
  .form-input {
    display: flex;
    flex-flow: row nowrap;
  }
  @media screen and (max-width: 660px) {
    .form-input {
      flex-flow: row wrap;
      justify-content: flex-end;
    }
  }
  @media screen and (max-width: 600px) {
    .form-options {
      margin: auto 0;
    }
    #encode-form {
      min-height: 110px;
    }
    .form-input {
      margin: 5px 0 0 0;
    }
  }
  @media screen and (max-width: 400px) {
    .form-options {
      flex-flow: row nowrap;
      justify-content: center;
    }
  }
</style>

<div id="encode-form" class="form-wrapper">
  <div class="form-options">
    <RadioButtons
      {...inputEncodingButtons}
      on:selectionChanged={inputTextEncodingChanged} />
    <RadioButtons
      {...outputEncodingButtons}
      on:selectionChanged={outputBase64EncodingChanged} />
  </div>
  <div class="form-input input-text">
    <Field>
      <Input expanded />
      <p class="control">
        <Button type="blue" on:click={submitEncodeForm}>Encode</Button>
      </p>
    </Field>
  </div>
</div>
