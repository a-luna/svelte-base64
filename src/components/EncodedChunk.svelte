<script>
  export let chunk = {}

  function highlightBase64ValueInLookupTable(event) {
    const selector = `.base64-lookup[data-base="${this.dataset.base}"]`
    const base64Lookup = document.querySelector(selector)
    if (!base64Lookup) return

    base64Lookup.classList.add("highlight-base64")
    this.classList.add("highlight-base64")
    base64Lookup.addEventListener("mouseleave", removeBase64Highlight)
    this.addEventListener("mouseleave", removeBase64Highlight)
  }

  function removeBase64Highlight(event) {
    const selector = ".highlight-base64"
    const matchingBase64 = document.querySelectorAll(selector)
    if (!matchingBase64) return

    matchingBase64.forEach(group => (group.onmouseleave = null))
    matchingBase64.forEach(group => group.classList.remove("highlight-base64"))
  }

  function highlightAsciiValueInLookupTable(event) {
    const selector = `.ascii-lookup[data-hex-byte="${this.dataset.hexByte}"]`
    const asciiLookup = document.querySelector(selector)
    if (!asciiLookup) return

    asciiLookup.classList.add("highlight-ascii")
    this.classList.add("highlight-ascii")
    asciiLookup.addEventListener("mouseleave", removeAsciiHighlight)
    this.addEventListener("mouseleave", removeAsciiHighlight)
  }

  function removeAsciiHighlight(event) {
    const selector = ".highlight-ascii"
    const matchingAscii = document.querySelectorAll(selector)
    if (!matchingAscii) return

    matchingAscii.forEach(group => (group.onmouseleave = null))
    matchingAscii.forEach(group => group.classList.remove("highlight-ascii"))
  }

  function highlightMatchingBitGroups(event) {
    const selector = `*[data-bit-group="${this.dataset.bitGroup}"]`
    const matchingGroups = document.querySelectorAll(selector)
    if (!matchingGroups) return

    matchingGroups.forEach(group => group.classList.remove("bit-group"))
    matchingGroups.forEach(group =>
      group
        .querySelectorAll("*[data-bit-group]")
        .forEach(group => group.classList.remove("bit-group"))
    )
    matchingGroups.forEach(group => group.classList.add("highlight-bit-group"))
    matchingGroups.forEach(group =>
      group.addEventListener("mouseleave", removeBitGroupHighlight)
    )
  }

  function removeBitGroupHighlight(event) {
    const selector = `*[data-bit-group="${this.dataset.bitGroup}"]`
    const matchingGroups = document.querySelectorAll(selector)
    if (!matchingGroups) return

    matchingGroups.forEach(group => (group.onmouseleave = null))
    matchingGroups.forEach(group => group.classList.remove("highlight-bit-group"))
    matchingGroups.forEach(group => group.classList.add("bit-group"))
    matchingGroups.forEach(group =>
      group
        .querySelectorAll("*[data-bit-group]")
        .forEach(group => group.classList.add("bit-group"))
    )
  }
</script>

<style>
  code,
  span {
    margin: 0;
  }
  .hex-map {
    margin: 0 0 5px 0;
  }
  .base64-map {
    margin: 5px 0 0 0;
  }
  .single-chunk {
    display: flex;
    flex-flow: column nowrap;
    border-right: 1px solid rgba(216, 216, 216, 0.45);
    padding: 0 10px;
  }
  .single-chunk:last-child {
    border: none;
  }
  .hex-map,
  .base64-map {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
  }
  .hex-digit:last-child {
    margin: 0 0 0 16px;
  }
  .hex-byte {
    margin: 0 2px;
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-end;
  }
  code.hex-ascii,
  code.base64-digit {
    font-weight: 400;
  }
  .base64 {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-end;
    min-width: 48px;
    margin: 0 1px;
  }
  code {
    display: block;
  }
  *[data-bit-group],
  *[data-hex-byte],
  *[data-base] {
    transition: background-color 0.35s ease-in-out;
  }
  .hex-byte:nth-child(even) code {
    font-weight: 700;
    color: #fe2d6c;
  }
  .hex-byte:nth-child(odd) code {
    font-weight: 400;
    color: #19f6d6;
  }
  .base64:nth-child(even) code {
    font-weight: 700;
    color: #7a32ff;
  }
  .base64:nth-child(odd) code {
    font-weight: 400;
    color: #7fff6e;
  }
  .hex-binary code,
  .base64-binary code {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
  }
  .small-font {
    font-size: 1.2rem;
  }
  .hide-element {
    display: none;
  }
  .hex-byte code.black,
  .base64-binary span.black {
    color: #202020;
    transition: color 0.35s ease-in-out;
  }
</style>

<div class="single-chunk">
  <div class="hex-map">
    {#each chunk.hexMap as hexByte}
      <div
        class="hex-byte"
        data-eight-bit="{hexByte.bin_word1}{hexByte.bin_word2}"
        data-hex-byte="{hexByte.hex_word1}{hexByte.hex_word2}"
        data-ascii={hexByte.ascii}
        data-bit-group={hexByte.groupId}
        on:mouseover={highlightMatchingBitGroups}
        on:mouseover={highlightAsciiValueInLookupTable}>
        <div>
          <code
            class="hex-ascii"
            data-ascii={hexByte.ascii}
            data-hex-byte="{hexByte.hex_word1}{hexByte.hex_word2}"
            class:hide-element={!chunk.isASCII}
            class:black={hexByte.isWhiteSpace}>
            {hexByte.ascii}
          </code>
          <code
            data-ascii={hexByte.ascii}
            data-hex-byte="{hexByte.hex_word1}{hexByte.hex_word2}">
            <span
              class="hex-digit"
              data-hex={hexByte.hex_word1}
              data-four-bit={hexByte.bin_word1}>
              {hexByte.hex_word1}
            </span>
            <span
              class="hex-digit"
              data-hex={hexByte.hex_word2}
              data-four-bit={hexByte.bin_word2}>
              {hexByte.hex_word2}
            </span>
          </code>
          <code
            class="hex-binary bit-group"
            data-ascii={hexByte.ascii}
            data-bit-group={hexByte.groupId}>
            <code>
              {#each hexByte.bitGroups as bitGroup}
                <span class="bit-group" data-bit-group={bitGroup.groupId}>
                  {bitGroup.bits}
                </span>
              {/each}
            </code>
          </code>
        </div>
      </div>
    {/each}
  </div>
  <div class="base64-map">
    {#each chunk.base64Map as base64Digit}
      <div
        class="base64"
        data-six-bit={base64Digit.bin}
        data-decimal={base64Digit.dec}
        data-base={base64Digit.b64}
        data-bit-group={base64Digit.groupId}
        on:mouseover={highlightMatchingBitGroups}
        on:mouseover={highlightBase64ValueInLookupTable}>
        <div>
          <code
            class="base64-binary bit-group"
            data-base={base64Digit.b64}
            data-bit-group={base64Digit.groupId}>
            <code>
              {#each base64Digit.bitGroups as bitGroup}
                <span
                  class="bit-group"
                  class:black={base64Digit.isPad}
                  data-bit-group={bitGroup.groupId}>
                  {bitGroup.bits}
                </span>
              {/each}
            </code>
          </code>
          <code
            class="base64-decimal"
            class:small-font={base64Digit.isPad}
            data-base={base64Digit.b64}
            data-decimal={base64Digit.dec}>
            {base64Digit.dec}
          </code>
          <code
            class="base64-digit"
            data-base={base64Digit.b64}
            data-decimal={base64Digit.dec}>
            {base64Digit.b64}
          </code>
        </div>
      </div>
    {/each}
  </div>
</div>
