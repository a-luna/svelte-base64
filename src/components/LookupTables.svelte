<script>
  import { getAsciiPrintableMap, getBase64Map } from "../helpers/base64.js"
  export let base64Encoding = "base64url"
  const asciiMapChunked = getAsciiPrintableMap()
  $: base64MapChunked = getBase64Map(base64Encoding)
  $: b64AlphabetDetail = base64Encoding == "base64" ? "Standard" : "URL and Filename safe"
</script>

<style>
  .lookup-tables {
    font-size: 11px;
    display: flex;
    flex-flow: row wrap;
    justify-content: space-around;
  }
  .table-wrapper h2 {
    font-size: 14px;
    font-weight: 400;
    text-align: center;
    margin: 10px 0;
  }
  .ascii-lookup-table,
  .base64-lookup-table {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    border: 1px solid rgba(216, 216, 216, 0.45);
    border-radius: 4px;
    margin: 10px auto 10px 0;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .ascii-lookup-chunk,
  .base64-lookup-chunk {
    border-right: 1px solid rgba(216, 216, 216, 0.45);
    padding: 0 3px;
  }
  .ascii-lookup-chunk:last-child,
  .base64-lookup-chunk:last-child {
    border: none;
  }
  .ascii-lookup-chunk {
    margin: 3px 0;
  }
  .base64-lookup-chunk {
    margin: 3px 0;
  }
  .ascii-lookup,
  .base64-lookup {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-end;
  }
  .ascii-lookup code {
    color: #ffb86c;
  }
  .base64-lookup code {
    color: #96d7f7;
  }
  .ascii-lookup code,
  .base64-lookup code {
    margin: 0 5px;
    white-space: nowrap;
    text-transform: none;
  }
  @media screen and (max-width: 825px) {
    .lookup-tables {
      font-size: 10px;
    }
    .table-wrapper h2 {
      font-size: 13px;
    }
  }
  @media screen and (max-width: 767px) {
    .lookup-tables {
      font-size: 9px;
    }
    .table-wrapper h2 {
      font-size: 13px;
    }
  }
  @media screen and (max-width: 720px) {
    .lookup-tables {
      font-size: 10px;
    }
    .table-wrapper h2 {
      font-size: 14px;
    }
  }
  @media screen and (max-width: 400px) {
    .lookup-tables {
      font-size: 10px;
    }
  }
</style>

<div class="lookup-tables">
  <div class="table-wrapper">
    <h2>ASCII Map (Printable Characters)</h2>
    <div class="ascii-lookup-table">
      {#each asciiMapChunked as asciiMap}
        <div class="ascii-lookup-chunk">
          {#each asciiMap as ascii}
            <div
              class="ascii-lookup"
              data-ascii={ascii.ascii}
              data-hex-byte={ascii.hex}
              data-eight-bit={ascii.bin}
              data-decimal={ascii.dec}>
              <code>{ascii.ascii}</code>
              <code>{ascii.hex}</code>
              <code>{ascii.binWord1} {ascii.binWord2}</code>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
  <div class="table-wrapper">
    <h2>Base64 Alphabet ({b64AlphabetDetail})</h2>
    <div class="base64-lookup-table">
      {#each base64MapChunked as base64Map}
        <div class="base64-lookup-chunk">
          {#each base64Map as base64}
            <div
              class="base64-lookup"
              data-base={base64.b64}
              data-six-bit={base64.bin}
              data-decimal={base64.dec}>
              <code>{base64.dec}</code>
              <code>{base64.bin}</code>
              <code>{base64.b64}</code>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>
