<script>
  import RadioButtons from "./RadioButtons.svelte"
  import Field from "svelma/src/components/Field.svelte"
  import Input from "svelma/src/components/Input.svelte"
  import Button from "svelma/src/components/Button.svelte"
  import { validateDecodeFormData, b64Decode } from "../helpers/base64.js"
  import { createEventDispatcher, onMount } from "svelte"
  const dispatch = createEventDispatcher()

  let inputBase64Encoding = "base64url"
  let encodedInputTextSelector = ".encoded-text input"

  onMount(() => {
    document.querySelector(encodedInputTextSelector)
    addEventListener("keyup", encodedInputTextChanged)
  })

  function interceptEnterKeyDecode(event) {
    if (event.keyCode == 13) {
      submitDecodeForm()
    } else {
      encodedInputTextChanged(event)
    }
  }

  function encodedInputTextChanged(event) {
    dispatch("encodedInputTextChanged", { encodedInputText: event.target.value })
  }

  function submitDecodeForm() {
    let encodedInputText = document.querySelector(encodedInputTextSelector).value
    let [{ success, error }, inputData] = validateDecodeFormData(
      encodedInputText,
      inputBase64Encoding
    )
    if (success) {
      let decodedData = b64Decode(inputData)
      dispatch("decodeFormSubmitted", {
        success: true,
        error: "",
        decodedData: decodedData,
      })
    } else {
      dispatch("decodeFormSubmitted", {
        success: false,
        error: error,
        decodedData: {},
      })
    }
  }

  function inputBase64EncodingChanged(event) {
    inputBase64Encoding = event.detail.value
    dispatch("formOptionChanged", {
      setting: "inputBase64Encoding",
      value: inputBase64Encoding,
    })
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
    justify-content: space-between;
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
    #decode-form {
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

<div id="decode-form" class="form-wrapper">
  <div class="form-options">
    <RadioButtons
      {...inputDecodingButtons}
      on:selectionChanged={inputBase64EncodingChanged} />
  </div>
  <div class="form-input encoded-text">
    <Field>
      <Input expanded />
      <p class="control">
        <Button type="green" on:click={submitDecodeForm}>Decode</Button>
      </p>
    </Field>
  </div>
</div>
