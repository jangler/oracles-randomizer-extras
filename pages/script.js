(() => {
  // src/lib.ts
  function romTitle(rom) {
    return Array.from(rom.slice(308, 319)).map((x) => String.fromCharCode(x)).join("");
  }

  // src/index.ts
  var fileInput = document.querySelector("#fileInput");
  var output = document.querySelector("#output");
  fileInput.addEventListener("change", (event) => {
    fileInput.files?.item(0)?.arrayBuffer().then((buf) => {
      output.textContent = romTitle(new Uint8Array(buf));
    });
  });
})();
