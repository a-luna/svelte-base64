const screenSettings = [
  { device: "ipad-mini", orientation: "portrait" },
  { device: "iphone-xr", orientation: "portrait" },
  { device: "iphone-5", orientation: "landscape" },
  { device: "macbook-13", orientation: "landscape" },
  { device: "samsung-note9", orientation: "portrait" },
]

describe("Base64 Visualizer", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  screenSettings.forEach(({ device, orientation }) => {
    it(`correctly encodes test vectors from RFC 4648 [device: ${device} orientation: ${orientation}]`, () => {
      cy.viewport(device, orientation)
      cy.get(".form-title").contains("Encode Text/Data")
      cy.get("#inputEncoding1").should("be.checked")
      cy.get("#inputEncoding2").should("not.be.checked")
      cy.get("#base64EncodingOut1").should("not.be.checked")
      cy.get("#base64EncodingOut2").should("be.checked")

      cy.get(".input-text input")
        .clear()
        .type("f")
      cy.get("#copyable-input-text").should("have.value", "f")
      cy.get(".results-in .encoding").contains("Encoding: ASCII")
      cy.get(".results-in .byte-length").contains("Total Bytes: 1")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "Zg==")
      cy.get(".results-out .encoding").contains("Encoding: base64url")

      cy.get(".input-text input")
        .clear()
        .type("fo")
      cy.get("#copyable-input-text").should("have.value", "fo")
      cy.get(".results-in .byte-length").contains("Total Bytes: 2")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "Zm8=")

      cy.get(".input-text input")
        .clear()
        .type("foo")
      cy.get("#copyable-input-text").should("have.value", "foo")
      cy.get(".results-in .byte-length").contains("Total Bytes: 3")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "Zm9v")

      cy.get(".input-text input")
        .clear()
        .type("foob")
      cy.get("#copyable-input-text").should("have.value", "foob")
      cy.get(".results-in .byte-length").contains("Total Bytes: 4")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "Zm9vYg==")

      cy.get(".input-text input")
        .clear()
        .type("fooba")
      cy.get("#copyable-input-text").should("have.value", "fooba")
      cy.get(".results-in .byte-length").contains("Total Bytes: 5")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "Zm9vYmE=")

      cy.get(".input-text input")
        .clear()
        .type("foobar")
      cy.get("#copyable-input-text").should("have.value", "foobar")
      cy.get(".results-in .byte-length").contains("Total Bytes: 6")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "Zm9vYmFy")
    })

    it(`correctly decodes test vectors from RFC 4648 [device: ${device} orientation: ${orientation}]`, () => {
      cy.viewport(device, orientation)
      cy.get(".form-title").contains("Encode Text/Data")
      cy.get(".form-title-buttons .button:first-child").click({ delay: 100 })
      cy.get(".form-title").contains("Decode Base64")
      cy.get("#base64EncodingIn1").should("not.be.checked")
      cy.get("#base64EncodingIn2").should("be.checked")

      cy.get(".encoded-text input")
        .clear()
        .type("Zg==")
      cy.get("#copyable-input-text").should("have.value", "Zg==")
      cy.get(".results-in .encoding").contains("Encoding: base64url")
      cy.get(".encoded-text button").click()
      cy.get("#copyable-output-text").should("have.value", "f")
      cy.get(".results-out .encoding").contains("Encoding: ASCII")
      cy.get(".results-out .byte-length").contains("Total Bytes: 1")

      cy.get(".encoded-text input")
        .clear()
        .type("Zm8=")
      cy.get("#copyable-input-text").should("have.value", "Zm8=")
      cy.get(".encoded-text button").click()
      cy.get("#copyable-output-text").should("have.value", "fo")
      cy.get(".results-out .encoding").contains("Encoding: ASCII")
      cy.get(".results-out .byte-length").contains("Total Bytes: 2")

      cy.get(".encoded-text input")
        .clear()
        .type("Zm9v")
      cy.get("#copyable-input-text").should("have.value", "Zm9v")
      cy.get(".encoded-text button").click()
      cy.get("#copyable-output-text").should("have.value", "foo")
      cy.get(".results-out .encoding").contains("Encoding: ASCII")
      cy.get(".results-out .byte-length").contains("Total Bytes: 3")

      cy.get(".encoded-text input")
        .clear()
        .type("Zm9vYg==")
      cy.get("#copyable-input-text").should("have.value", "Zm9vYg==")
      cy.get(".encoded-text button").click()
      cy.get("#copyable-output-text").should("have.value", "foob")
      cy.get(".results-out .encoding").contains("Encoding: ASCII")
      cy.get(".results-out .byte-length").contains("Total Bytes: 4")

      cy.get(".encoded-text input")
        .clear()
        .type("Zm9vYmE=")
      cy.get("#copyable-input-text").should("have.value", "Zm9vYmE=")
      cy.get(".encoded-text button").click()
      cy.get("#copyable-output-text").should("have.value", "fooba")
      cy.get(".results-out .encoding").contains("Encoding: ASCII")
      cy.get(".results-out .byte-length").contains("Total Bytes: 5")

      cy.get(".encoded-text input")
        .clear()
        .type("Zm9vYmFy")
      cy.get("#copyable-input-text").should("have.value", "Zm9vYmFy")
      cy.get(".encoded-text button").click()
      cy.get("#copyable-output-text").should("have.value", "foobar")
      cy.get(".results-out .encoding").contains("Encoding: ASCII")
      cy.get(".results-out .byte-length").contains("Total Bytes: 6")
    })

    it(`correctly encodes hex data in both base64 and base64url [device: ${device} orientation: ${orientation}]`, () => {
      cy.viewport(device, orientation)
      cy.get(".form-title").contains("Encode Text/Data")
      cy.get("#inputEncoding1").should("be.checked")
      cy.get("#inputEncoding2").should("not.be.checked")
      cy.get("#base64EncodingOut1").should("not.be.checked")
      cy.get("#base64EncodingOut2").should("be.checked")
      cy.get('label[for="inputEncoding2"]').click()
      cy.get("#inputEncoding2").should("be.checked")
      cy.get('label[for="base64EncodingOut1"]').click()
      cy.get("#base64EncodingOut1").should("be.checked")

      cy.get(".input-text input")
        .clear()
        .type("0x14fb9c03d97e")
      cy.get("#copyable-input-text").should("have.value", "0x14fb9c03d97e")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 6")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "FPucA9l+")
      cy.get(".results-out .encoding").contains("Encoding: base64")

      cy.get(".input-text input")
        .clear()
        .type("14fb9c03d97e")
      cy.get("#copyable-input-text").should("have.value", "14fb9c03d97e")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 6")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "FPucA9l+")
      cy.get(".results-out .encoding").contains("Encoding: base64")

      cy.get(".input-text input")
        .clear()
        .type("0x14fb9c03d9")
      cy.get("#copyable-input-text").should("have.value", "0x14fb9c03d9")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 5")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "FPucA9k=")

      cy.get(".input-text input")
        .clear()
        .type("14fb9c03d9")
      cy.get("#copyable-input-text").should("have.value", "14fb9c03d9")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 5")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "FPucA9k=")

      cy.get(".input-text input")
        .clear()
        .type("0x14fb9c03")
      cy.get("#copyable-input-text").should("have.value", "0x14fb9c03")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 4")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "FPucAw==")

      cy.get(".input-text input")
        .clear()
        .type("14fb9c03")
      cy.get("#copyable-input-text").should("have.value", "14fb9c03")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 4")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "FPucAw==")

      cy.get('label[for="base64EncodingOut2"]').click()
      cy.get("#base64EncodingOut2").should("be.checked")

      cy.get(".input-text input")
        .clear()
        .type("0x14fb9c03d97e")
      cy.get("#copyable-input-text").should("have.value", "0x14fb9c03d97e")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 6")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "FPucA9l-")
      cy.get(".results-out .encoding").contains("Encoding: base64url")

      cy.get(".input-text input")
        .clear()
        .type("14fb9c03d97e")
      cy.get("#copyable-input-text").should("have.value", "14fb9c03d97e")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 6")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "FPucA9l-")

      cy.get(".input-text input")
        .clear()
        .type("0x14fb9c03d9")
      cy.get("#copyable-input-text").should("have.value", "0x14fb9c03d9")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 5")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "FPucA9k=")

      cy.get(".input-text input")
        .clear()
        .type("14fb9c03d9")
      cy.get("#copyable-input-text").should("have.value", "14fb9c03d9")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 5")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "FPucA9k=")

      cy.get(".input-text input")
        .clear()
        .type("0x14fb9c03")
      cy.get("#copyable-input-text").should("have.value", "0x14fb9c03")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 4")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "FPucAw==")

      cy.get(".input-text input")
        .clear()
        .type("14fb9c03")
      cy.get("#copyable-input-text").should("have.value", "14fb9c03")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 4")
      cy.get(".input-text button").click()
      cy.get("#copyable-output-text").should("have.value", "FPucAw==")
    })

    it(`raises error when invalid hex data is provided [device: ${device} orientation: ${orientation}]`, () => {
      cy.viewport(device, orientation)
      cy.get(".form-title").contains("Encode Text/Data")
      cy.get("#inputEncoding1").should("be.checked")
      cy.get("#inputEncoding2").should("not.be.checked")
      cy.get("#base64EncodingOut1").should("not.be.checked")
      cy.get("#base64EncodingOut2").should("be.checked")
      cy.get('label[for="inputEncoding2"]').click()
      cy.get("#inputEncoding2").should("be.checked")

      cy.get(".input-text input")
        .clear()
        .type("foobar")
      cy.get("#copyable-input-text").should("have.value", "foobar")
      cy.get(".results-in .encoding").contains("Encoding: Hex")
      cy.get(".results-in .byte-length").contains("Total Bytes: 3")
      cy.get(".input-text button").click()
      cy.get(".notification").should("be.visible")
      cy.get(".notification .media-content").contains(
        '"foobar" is not a valid hex string, must contain only hexadecimal digits (a-f, A-F, 0-9)'
      )
    })
  })
})
