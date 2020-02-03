const B64_ALPHABET_COMMON =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

const BIN_TO_HEX = {
  "0000": "0",
  "0001": "1",
  "0010": "2",
  "0011": "3",
  "0100": "4",
  "0101": "5",
  "0110": "6",
  "0111": "7",
  "1000": "8",
  "1001": "9",
  "1010": "A",
  "1011": "B",
  "1100": "C",
  "1101": "D",
  "1110": "E",
  "1111": "F",
}

export function getAsciiPrintableMap() {
  let asciiMap = []
  for (let i = 32; i < 127; i++) {
    let bin = i.toString(2)
    const padLength = 8 - bin.length
    bin = `${"0".repeat(padLength)}${bin}`
    let binWord1 = bin.substring(0, 4)
    let binWord2 = bin.substring(4, 8)
    let hex = `${BIN_TO_HEX[binWord1]}${BIN_TO_HEX[binWord2]}`
    asciiMap.push({
      ascii: String.fromCharCode(i),
      hex: hex,
      binWord1: binWord1,
      binWord2: binWord2,
      bin: bin,
      dec: i,
    })
  }
  return makeChunkedList(asciiMap, 32)
}

export function getBase64Map(base64Encoding) {
  let base64Alphabet = getBase64Alphabet(base64Encoding)
  let base64Map = []
  base64Alphabet.split("").forEach((b64, index) => {
    let byteString = index.toString(2)
    const padLength = 6 - byteString.length
    byteString = `${"0".repeat(padLength)}${byteString}`
    base64Map.push({
      b64: b64,
      bin: byteString,
      dec: index,
    })
  })
  base64Map.push({
    b64: "=",
    bin: "------",
    dec: "--",
  })
  return makeChunkedList(base64Map, 26)
}

function makeChunkedList(inputList, chunkSize) {
  let chunkedList = []
  let totalChunks = (inputList.length / chunkSize) | 0
  let lastChunkIsUneven = inputList.length % chunkSize > 0
  if (lastChunkIsUneven) {
    totalChunks += 1
  }
  for (let i = 0; i < totalChunks; i++) {
    let start = i * chunkSize
    let end = start + chunkSize
    if (lastChunkIsUneven && i === totalChunks - 1) {
      end = inputList.length
    }
    chunkedList.push(inputList.slice(start, end))
  }
  return chunkedList
}

export function validateEncodeFormData(inputText, inputEncoding, base64Encoding) {
  if (inputEncoding == "Hex" && /^0x\w+$/.test(inputText)) {
    inputText = inputText.replace(/0x/, "")
  }
  let { inputIsValid, errorMessage, inputBytes } = validateTextEncoding(
    inputText,
    inputEncoding
  )
  if (!inputIsValid) {
    return [{ inputIsValid: false, errorMessage: errorMessage }, {}]
  }
  const totalBytes = inputBytes.length
  let totalChunks = (totalBytes / 3) | 0
  const lastChunkLength = totalBytes % 3
  let lastChunkPadded = false
  let padLength = 0
  if (lastChunkLength > 0) {
    totalChunks += 1
    lastChunkPadded = true
    padLength = (3 - lastChunkLength) * 2
  }
  const inputData = {
    inputText: inputText,
    inputBytes: inputBytes,
    inputEncoding: inputEncoding,
    base64Encoding: base64Encoding,
    totalBytes: totalBytes,
    totalChunks: totalChunks,
    lastChunkPadded: lastChunkPadded,
    lastChunkLength: lastChunkLength,
    padLength: padLength,
  }
  return [{ inputIsValid: true, errorMessage: "" }, inputData]

  function validateTextEncoding(input, encoding) {
    if (encoding === "ASCII") {
      return validateStringIsAscii(input)
    }
    return validateStringIsHex(input)
  }

  function validateStringIsAscii(input) {
    let success = false
    let error = ""
    let inputBytes = []
    if (input.length == 0) {
      error = "You must provide a string value to encode, text box is empty."
    } else if (!/^[ -~]+$/.test(input)) {
      error = `"${input}" contains data or characters that are not within the set of ASCII printable characters (0x20 - 0x7E)`
    } else {
      success = true
      inputBytes = stringToByteArray(inputText)
    }
    return { inputIsValid: success, errorMessage: error, inputBytes: inputBytes }
  }

  function validateStringIsHex(input) {
    let success = false
    let error = ""
    let inputBytes = []
    if (input.length == 0) {
      error = "You must provide a string value to encode, text box is empty."
    } else if (!/^[0-9A-Fa-f]+$/.test(input)) {
      error = `"${input}" is not a valid hex string, must contain only hexadecimal digits (a-f, A-F, 0-9)`
    } else if (input.length % 2 > 0) {
      error = `Hex string must have an even number of digits, length(${inputText}) = ${inputText.length}`
    } else {
      success = true
      inputBytes = hexStringToByteArray(inputText)
    }
    return { inputIsValid: success, errorMessage: error, inputBytes: inputBytes }
  }
}

export function b64Encode({
  inputText,
  inputBytes,
  inputEncoding,
  base64Encoding,
  totalBytes,
  totalChunks,
  lastChunkPadded,
  lastChunkLength,
  padLength,
}) {
  let encodedBase64 = ""
  let encodedChunks = []
  for (let i = 0; i < totalChunks; i++) {
    let start = i * 3
    let end = start + 3
    let chunkIsPadded = false
    if (lastChunkPadded && i === totalChunks - 1) {
      end = totalBytes
      chunkIsPadded = true
    }
    let chunkBytes = inputBytes.slice(start, end)
    let chunkHexString = byteArrayToHexString(chunkBytes)
    let chunkText = chunkHexString
    if (inputEncoding === "ASCII") {
      chunkText = inputText.substring(start, end)
    }
    let chunkData = {
      chunkText: chunkText,
      chunkBytes: chunkBytes,
      chunkHexString: chunkHexString,
      chunkIsPadded: chunkIsPadded,
      chunkNumber: i,
      totalChunks: totalChunks,
      lastChunkPadded: lastChunkPadded,
      lastChunkLength: lastChunkLength,
      padLength: padLength,
    }
    let encodedChunk = encodeChunk(chunkData)
    encodedChunk.isASCII = inputEncoding === "ASCII"
    encodedChunks.push(encodedChunk)
    encodedBase64 += encodedChunk.chunkBase64
  }
  return {
    inputText: inputText,
    chunks: processFinalResults(encodedChunks),
    inputEncoding: inputEncoding,
    outputEncoding: base64Encoding,
    isASCII: validateAsciiEncoding(inputBytes),
    outputText: encodedBase64,
  }

  // Local Functions
  function encodeChunk({
    chunkText,
    chunkBytes,
    chunkHexString,
    chunkIsPadded,
    padLength,
  }) {
    let inputHexMap = []
    let chunkAsciiString = byteArrayToString(chunkBytes)
    let chunkBinStringArray = byteArrayTo8BitStringArray(chunkBytes)
    let chunkBinaryString = chunkBinStringArray.map(s => s).join("")
    for (let i = 0; i < chunkBinStringArray.length; i++) {
      const byteString = chunkBinStringArray[i]
      const word1 = byteString.substring(0, 4)
      const word2 = byteString.substring(4, 8)
      const byteMap = {
        bin_word1: word1,
        bin_word2: word2,
        hex_word1: BIN_TO_HEX[word1],
        hex_word2: BIN_TO_HEX[word2],
        ascii: chunkAsciiString[i],
        isWhiteSpace: false,
      }
      if (/^\s+$/.test(byteMap.ascii)) {
        byteMap.isWhiteSpace = true
        byteMap.ascii = "ws"
      }
      inputHexMap.push(byteMap)
    }
    if (chunkIsPadded) {
      chunkBinaryString += "0".repeat(padLength)
    }
    const base64Alphabet = getBase64Alphabet(base64Encoding)
    const chunkLength = chunkBinaryString.length / 6
    let chunkBase64 = ""
    let encodedBase64Map = []
    for (let i = 0; i < chunkLength; i++) {
      let start = i * 6
      let end = start + 6
      const base64Digit6bit = chunkBinaryString.substring(start, end)
      const word1 = `00${base64Digit6bit.substring(0, 2)}`
      const word2 = base64Digit6bit.substring(2, 6)
      const base64DigitHex = `${BIN_TO_HEX[word1]}${BIN_TO_HEX[word2]}`
      const base64DigitDecimal = parseInt(base64DigitHex, 16)
      const base64Digit = base64Alphabet[base64DigitDecimal]
      chunkBase64 += base64Digit
      const base64ByteMap = {
        bin: base64Digit6bit,
        dec: base64DigitDecimal,
        b64: base64Digit,
        isPad: false,
      }
      encodedBase64Map.push(base64ByteMap)
    }
    if (chunkIsPadded) {
      const encodedPadLength = 4 - chunkLength
      chunkBase64 += "=".repeat(encodedPadLength)
      for (let i = 0; i < encodedPadLength; i++) {
        const encodedPadByteMap = {
          bin: "",
          dec: "",
          b64: "=",
          isPad: true,
        }
        encodedBase64Map.push(encodedPadByteMap)
      }
    }
    const encodedChunk = {
      chunkBase64: chunkBase64,
      chunkBytes: chunkBytes,
      chunkText: chunkText,
      chunkHexString: chunkHexString,
      hexMap: inputHexMap,
      base64Map: encodedBase64Map,
    }
    return encodedChunk
  }
}

function validateAsciiEncoding(byteArray) {
  return byteArray.every(byte => byte > 31 && byte < 127)
}

export function validateDecodeFormData(encodedText, base64Encoding) {
  // Preserve the original text value provided by the user
  const originalInputText = encodedText

  // Remove padding characters
  encodedText = encodedText.replace(/[=]/g, "")
  let [base64Alphabet, base64AlphabetMap] = getBase64AlphabetMap(base64Encoding)
  let { inputIsValid, errorMessage } = validateBase64Encoding(
    originalInputText,
    encodedText,
    base64Alphabet,
    base64Encoding
  )
  if (!inputIsValid) {
    return [{ inputIsValid: false, errorMessage: errorMessage }, {}]
  }
  let totalChunks = (encodedText.length / 4) | 0
  let lastChunkLength = encodedText.length % 4
  if (lastChunkLength === 1) {
    errorMessage = `"${originalInputText}" is not a valid ${base64Encoding} string.`
    return [{ inputIsValid: false, errorMessage: errorMessage }, {}]
  }
  let lastChunkPadded = false
  if (lastChunkLength > 0) {
    totalChunks += 1
    lastChunkPadded = true
  }
  const inputData = {
    encodedText: encodedText,
    originalInputText: originalInputText,
    inputLength: encodedText.length,
    base64Encoding: base64Encoding,
    base64Alphabet: base64Alphabet,
    base64AlphabetMap: base64AlphabetMap,
    totalChunks: totalChunks,
    lastChunkPadded: lastChunkPadded,
    lastChunkLength: lastChunkLength,
  }
  return [{ inputIsValid: true }, inputData]

  function getBase64AlphabetMap(base64Encoding) {
    let base64Alphabet = getBase64Alphabet(base64Encoding)
    let base64AlphabetMap = {}
    base64Alphabet.split("").forEach((letter, index) => {
      base64AlphabetMap[letter] = index
    })
    return [base64Alphabet, base64AlphabetMap]
  }

  function validateBase64Encoding(
    inputText,
    encodedText,
    base64Alphabet,
    base64Encoding
  ) {
    let onlyValidCharacters = false
    let validFormat = false
    if (inputText.length == 0) {
      const errorMessage = "You must provide a string value to decode, text box is empty."
      return { inputIsValid: false, errorMessage: errorMessage }
    }
    if (base64Encoding === "base64") {
      onlyValidCharacters = /^[0-9A-Za-z+/=]+$/.test(inputText)
      validFormat = /^[0-9A-Za-z+/]+[=]{0,2}$/.test(inputText)
    } else if (base64Encoding === "base64url") {
      onlyValidCharacters = /^[0-9A-Za-z-_=]+$/.test(inputText)
      validFormat = /^[0-9A-Za-z-_]+[=]{0,2}$/.test(inputText)
    }
    if (!onlyValidCharacters) {
      let invalid = encodedText.split("").filter(char => !base64Alphabet.includes(char))
      let distinct = [...new Set(invalid)]
      let invalid_str = []
      distinct.forEach(char => invalid_str.push(`["${char}", 0x${char.charCodeAt(0)}]`))
      invalid_str = invalid_str.join("\n")
      let pluralMaybe = distinct.length > 1 ? "characters" : "character"
      const errorMessage = `"${inputText}" contains ${distinct.length} invalid ${pluralMaybe}:\n${invalid_str}.`
      return { inputIsValid: false, errorMessage: errorMessage }
    }
    if (!validFormat) {
      const errorMessage = `"${inputText}" is not a valid ${base64Encoding} string.`
      return { inputIsValid: false, errorMessage: errorMessage }
    }
    return { inputIsValid: true, errorMessage: "" }
  }
}

function getBase64Alphabet(base64Encoding) {
  let b64Alphabet = B64_ALPHABET_COMMON
  return base64Encoding === "base64" ? (b64Alphabet += "+/") : (b64Alphabet += "-_")
}

export function b64Decode({
  encodedText,
  originalInputText,
  inputLength,
  base64Encoding,
  base64AlphabetMap,
  totalChunks,
  lastChunkPadded,
  lastChunkLength,
}) {
  let binaryString = ""
  let decodedChunks = []
  for (let i = 0; i < totalChunks; i++) {
    let start = i * 4
    let end = start + 4
    let chunkIsPadded = false
    if (lastChunkPadded && i == totalChunks - 1) {
      end = inputLength
      chunkIsPadded = true
    }
    let chunkBase64 = encodedText.substring(start, end)
    let chunkData = {
      chunkBase64: chunkBase64,
      chunkIsPadded: chunkIsPadded,
      base64AlphabetMap: base64AlphabetMap,
      chunkNumber: i,
      totalChunks: totalChunks,
      lastChunkPadded: lastChunkPadded,
      lastChunkLength: lastChunkLength,
    }
    let decodedChunk = decodeChunk(chunkData)
    decodedChunks.push(decodedChunk)
    binaryString += decodedChunk.chunkBinaryString
  }
  let totalBytes = (binaryString.length / 8) | 0
  return decodeBytes(
    originalInputText,
    base64Encoding,
    binaryString,
    totalBytes,
    decodedChunks
  )

  // Local Functions
  function decodeChunk({
    chunkBase64,
    chunkIsPadded,
    base64AlphabetMap,
    lastChunkLength,
  }) {
    let chunkBinaryString = ""
    let decodedBase64Map = []
    let chunkBase64Digits = chunkBase64.split("")
    for (let i = 0; i < chunkBase64Digits.length; i++) {
      let base64Digit = chunkBase64Digits[i]
      let base64DigitDecimal = base64AlphabetMap[base64Digit]
      let base64DigitBinary = base64DigitDecimal.toString(2)
      const padLength = 6 - base64DigitBinary.length
      base64DigitBinary = `${"0".repeat(padLength)}${base64DigitBinary}`
      chunkBinaryString += base64DigitBinary
      let base64ByteMap = {
        bin: base64DigitBinary,
        dec: base64DigitDecimal,
        b64: base64Digit,
        isPad: false,
      }
      decodedBase64Map.push(base64ByteMap)
    }
    if (chunkIsPadded) {
      const padLength = 4 - lastChunkLength
      chunkBase64 += "=".repeat(padLength)
      //chunkBinaryString += "000000"
      for (let i = 0; i < padLength; i++) {
        const byteMap = {
          bin: "",
          dec: "",
          b64: "=",
          isPad: true,
        }
        decodedBase64Map.push(byteMap)
      }
    }
    const decodedChunk = {
      chunkBase64: chunkBase64,
      chunkBinaryString: chunkBinaryString,
      base64Map: decodedBase64Map,
    }
    return decodedChunk
  }

  function decodeBytes(
    originalInputText,
    base64Encoding,
    binaryString,
    totalBytes,
    decodedChunks
  ) {
    let decodedHexString = ""
    let hexMap = []
    for (let i = 0; i < totalBytes; i++) {
      let start = i * 8
      let end = start + 8
      let byteString = binaryString.substring(start, end)
      let word1 = byteString.substring(0, 4)
      let word2 = byteString.substring(4, 8)
      let hexWord1 = BIN_TO_HEX[word1]
      let hexWord2 = BIN_TO_HEX[word2]
      let hexByteString = `${hexWord1}${hexWord2}`
      decodedHexString += hexByteString
      let hexByte = hexStringToByteArray(hexByteString)
      const byteMap = {
        bin_word1: word1,
        bin_word2: word2,
        hex_word1: hexWord1,
        hex_word2: hexWord2,
        ascii: byteArrayToString(hexByte),
      }
      if (/^\s+$/.test(byteMap.ascii)) {
        byteMap.isWhiteSpace = true
        byteMap.ascii = "ws"
      }
      hexMap.push(byteMap)
    }
    const decodedBytes = hexStringToByteArray(decodedHexString)
    return mapHexBytesToBase64Chunks(
      originalInputText,
      base64Encoding,
      decodedHexString,
      hexMap,
      decodedBytes,
      decodedChunks
    )
  }

  function mapHexBytesToBase64Chunks(
    originalInputText,
    base64Encoding,
    decodedHexString,
    hexMap,
    decodedBytes,
    decodedChunks
  ) {
    let decodedString = ""
    let isASCII = validateAsciiEncoding(decodedBytes)
    if (isASCII) {
      decodedString = byteArrayToString(decodedBytes)
    }
    for (let i = 0; i < decodedChunks.length; i++) {
      let bytesInChunk = []
      for (let j = 0; j < 3; j++) {
        let byteIndex = i * 3 + j
        if (byteIndex === hexMap.length) {
          break
        }
        bytesInChunk.push(hexMap[byteIndex])
      }
      decodedChunks[i].hexMap = bytesInChunk
      decodedChunks[i].isASCII = isASCII
    }
    const finalResults = {
      inputText: originalInputText,
      chunks: processFinalResults(decodedChunks),
      inputEncoding: base64Encoding,
      outputEncoding: isASCII ? "ASCII" : "Hex",
      isASCII: isASCII,
      outputText: isASCII ? decodedString : decodedHexString,
      totalBytesOutput: decodedBytes.length,
    }
    return finalResults
  }
}

function processFinalResults(chunks) {
  for (let i = 0; i < chunks.length; i++) {
    let base64Map = chunks[i].base64Map
    let base64Digit1 = base64Map[0]
    let base64Digit2 = base64Map[1]
    let base64Digit3 = base64Map[2]
    let base64Digit4 = base64Map[3]
    let base64BinaryString = `${base64Digit1.bin}${base64Digit2.bin}${base64Digit3.bin}${base64Digit4.bin}`
    let base64Bits1 = base64BinaryString.substring(0, 6)
    let base64Bits2a = base64BinaryString.substring(6, 8)
    let base64Bits2b = base64BinaryString.substring(8, 12)
    let base64Bits3a = base64BinaryString.substring(12, 16)
    let base64Bits3b = base64BinaryString.substring(16, 18)
    let base64Bits4 = base64BinaryString.substring(18, 24)
    let hexBits1a = base64Bits1
    let hexBits1b = base64Bits2a
    let hexBits2a = base64Bits2b
    let hexBits2b = base64Bits3a
    let hexBits3a = base64Bits3b
    let hexBits3b = base64Bits4

    base64Digit1.groupId = `base64-chunk-${i + 1}-digit-1`
    base64Digit1.bitGroups = [{ groupId: `hex-chunk-${i + 1}-byte-1`, bits: hexBits1a }]
    base64Digit2.groupId = `base64-chunk-${i + 1}-digit-2`
    base64Digit2.bitGroups = [
      { groupId: `hex-chunk-${i + 1}-byte-1`, bits: hexBits1b },
      { groupId: `hex-chunk-${i + 1}-byte-2`, bits: hexBits2a },
    ]
    base64Digit3.groupId = `base64-chunk-${i + 1}-digit-3`
    base64Digit3.bitGroups = [
      { groupId: `hex-chunk-${i + 1}-byte-2`, bits: hexBits2b },
      { groupId: `hex-chunk-${i + 1}-byte-3`, bits: hexBits3a },
    ]
    base64Digit4.groupId = `base64-chunk-${i + 1}-digit-4`
    base64Digit4.bitGroups = [{ groupId: `hex-chunk-${i + 1}-byte-3`, bits: hexBits3b }]

    let hexMap = chunks[i].hexMap
    let hexByte1 = hexMap[0]
    hexByte1.groupId = `hex-chunk-${i + 1}-byte-1`
    hexByte1.bitGroups = [
      { groupId: `base64-chunk-${i + 1}-digit-1`, bits: base64Bits1 },
      { groupId: `base64-chunk-${i + 1}-digit-2`, bits: base64Bits2a },
    ]
    if (hexMap.length == 1) {
      base64Digit2.bitGroups = [
        { groupId: `hex-chunk-${i + 1}-byte-1`, bits: hexBits1b },
        { groupId: "pad", bits: hexBits2a },
      ]
      base64Digit3.bitGroups = [
        { groupId: "pad", bits: hexBits2b },
        { groupId: "pad", bits: hexBits3a },
      ]
      base64Digit4.bitGroups = [{ groupId: "pad", bits: hexBits3b }]
      continue
    }
    let hexByte2 = hexMap[1]
    hexByte2.groupId = `hex-chunk-${i + 1}-byte-2`
    hexByte2.bitGroups = [
      { groupId: `base64-chunk-${i + 1}-digit-2`, bits: base64Bits2b },
      { groupId: `base64-chunk-${i + 1}-digit-3`, bits: base64Bits3a },
    ]
    if (hexMap.length == 2) {
      base64Digit3.bitGroups = [
        { groupId: `hex-chunk-${i + 1}-byte-2`, bits: hexBits2b },
        { groupId: "pad", bits: hexBits3a },
      ]
      base64Digit4.bitGroups = [{ groupId: "pad", bits: hexBits3b }]
      continue
    }
    let hexByte3 = hexMap[2]
    hexByte3.groupId = `hex-chunk-${i + 1}-byte-3`
    hexByte3.bitGroups = [
      { groupId: `base64-chunk-${i + 1}-digit-3`, bits: base64Bits3b },
      { groupId: `base64-chunk-${i + 1}-digit-4`, bits: base64Bits4 },
    ]
  }
  return chunks
}

function stringToByteArray(s) {
  let result = []
  for (let i = 0; i < s.length; i++) {
    result[i] = s.charCodeAt(i)
  }
  return result
}

function byteArrayToString(byteArray) {
  let result = ""
  for (let i = 0; i < byteArray.length; i++) {
    result += String.fromCharCode(byteArray[i])
  }
  return result
}

function byteArrayToHexString(byteArray) {
  let hexString = ""
  let nextHexByte
  for (let i = 0; i < byteArray.length; i++) {
    nextHexByte = byteArray[i].toString(16) // Integer to base 16
    if (nextHexByte.length < 2) {
      nextHexByte = "0" + nextHexByte // Otherwise 10 becomes just a instead of 0a
    }
    hexString += nextHexByte
  }
  return hexString
}

function hexStringToByteArray(hexString) {
  if (hexString.length % 2 !== 0) {
    throw "Must have an even number of hex digits to convert to bytes"
  }
  let numBytes = hexString.length / 2
  let byteArray = new Uint8Array(numBytes)
  for (let i = 0; i < numBytes; i++) {
    byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16)
  }
  return byteArray
}

function byteArrayTo8BitStringArray(byteArray) {
  let binary = []
  for (var i = 0; i < byteArray.length; i++) {
    let byteString = `${byteArray[i].toString(2)}`
    const padLength = 8 - byteString.length
    binary.push(`${"0".repeat(padLength)}${byteString}`)
  }
  return binary
}
