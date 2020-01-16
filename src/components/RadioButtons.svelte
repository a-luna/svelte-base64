<script>
  export let title = ""
  export let form = ""
  export let groupId = ""
  export let groupName = ""
  export let buttons = []
  import { createEventDispatcher } from "svelte"

  const dispatch = createEventDispatcher()
  function raiseSelectionChanged(event) {
    dispatch("selectionChanged", {
      groupId: groupId,
      groupName: groupName,
      selectionId: event.target.id,
      value: event.target.value,
    })
  }
</script>

<style>
  .radio-group {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    max-width: 180px;
    margin: 0 10px;
  }
  .radio-buttons {
    display: flex;
    flex-flow: column nowrap;
    margin: 0 2px 2px 2px;
    justify-content: flex-start;
    padding: 0 5px;
  }
  fieldset {
    border: 1px solid rgba(216, 216, 216, 0.45);
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 1.4rem;
    width: 100%;
  }
  legend {
    color: #f2f2f2;
    font-weight: 400;
    margin: 0 auto;
    padding: 0 3px;
  }
  input[type="radio"] {
    position: absolute;
    top: auto;
    overflow: hidden;
    clip: rect(1px, 1px, 1px, 1px);
    width: 1px;
    height: 1px;
    white-space: nowrap;
  }
  input[type="radio"] + label {
    display: block;
    color: #d8d8d8;
    padding: 3px;
    padding-left: 25px;
    max-width: calc(100% - 2em);
  }
  input[type="radio"]:focus + label {
    color: #fa72f8;
  }
  input[type="radio"] + label::before {
    content: "";
    background: rgb(37, 37, 37);
    border: 0.1em solid rgba(216, 216, 216, 0.45);
    border-radius: 100%;
    background-color: rgb(37, 37, 37, 80%);
    display: block;
    box-sizing: border-box;
    float: left;
    width: 1em;
    height: 1em;
    margin-left: -1.5em;
    margin-top: 0.15em;
    cursor: pointer;
    text-align: center;
    transition: all 0.1s ease-out;
  }
  input[type="radio"]:disabled + label::before {
    border: 0.1em solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.1);
  }
  input[type="radio"]:disabled + label {
    color: #555;
  }
  input[type="radio"]:checked + label {
    color: #fa72f8;
  }
  input[type="radio"]:checked + label::before {
    background-color: #fa72f8;
    box-shadow: inset 0 0 0 0.15em rgba(0, 0, 0, 0.95);
  }
</style>

<div id={groupId} class="radio-group">
  <fieldset name={groupName} {form}>
    <legend>{title}</legend>
    <div class="radio-buttons">
      {#each buttons as button}
        <div class="button-wrapper">
          <input
            type="radio"
            id={button.id}
            name={groupName}
            value={button.value}
            checked={button.checked}
            on:change={raiseSelectionChanged} />
          <label for={button.id}>{button.label}</label>
        </div>
      {/each}
    </div>
  </fieldset>
</div>
