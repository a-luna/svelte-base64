# svelte-base64

This is a simple application that encodes/decodes ASCII text or hex strings to/from base64 and provides reactive UI components to help illustrate the encoding process. You can easily view and fork this project on codesandbox:

<a href="https://codesandbox.io/s/github/a-luna/svelte-base64/tree/master/?fontsize=12&hidenavigation=1&theme=dark" target="_blank">
<img alt="Edit svelte-base64" src="https://codesandbox.io/static/img/play-codesandbox.svg">
</a>

- ### Base64 Encoder/Decoder

  - Input/output strings displayed in hex, decimal, binary, and base64 to demonstrate how input bytes are encoded to base64
  - Mouseover/touch any part of the Hex/Base64 output to highlight all related bit groups and the matching base64/ASCII characters in the Lookup Tables
  - Hex strings must contain only numbers and/or upper and lowercase hex digits (a-f, A-F, 0-9)
  - Hex strings can be prefixed by "0x", but not required
  - Encoded strings must be valid [base64 (standard)](https://tools.ietf.org/html/rfc4648#section-4) or [base64url (url/filename safe)](https://tools.ietf.org/html/rfc4648#section-5) values

- ### CSS Preprocessing

  - [Svelte 3](https://github.com/sveltejs/svelte) + [Svelma](https://github.com/c0bra/svelma) integrated via [`svelte-preprocess`](https://github.com/kaisermann/svelte-preprocess)
    - Svelma is a set of UI components for Svelte based on the Bulma CSS framework.
  - [Bulma CSS](https://github.com/jgthms/bulma)/FontAwesome 5 integrated via [`node-sass`](https://github.com/sass/node-sass)

- ### Rollup & Plugins Config

  - Configured to process and minify SASS/SCSS files and copy to`public/build` folder (`node-sass`, `postcss`/`cssnano`)
  - Configured to copy FA font files from `node_modules` folder and copy to `public` folder
  - Configured to minify entire bundle when building for production
  - [resolve](https://www.npmjs.com/package/@rollup/plugin-node-resolve), [commonjs](https://www.npmjs.com/package/@rollup/plugin-commonjs), and [terser](https://github.com/TrySound/rollup-plugin-terserhttps://github.com/TrySound/rollup-plugin-terser) rollup plugins configured

- ### Tests

  - Cypress E2E tests created for basic encode/decode scenarios
  - 1/5 test cases is failing due to bug that can not be reproduced outside of Cypress
  - 5 test cases are each executed with 4 different screen types/orientations
  - Input and expected output for both ASCII and Hex strings taken directly from the [Examples and Illustrations](https://tools.ietf.org/html/rfc4648#section-9) and [Test Vectors](https://tools.ietf.org/html/rfc4648#section-10) sections of RFC4648 which is the original specification for Base64 and other print-safe binary encodings

Please leave any feedback by logging an issue, especially bugs! Thanks.
