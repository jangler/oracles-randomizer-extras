(() => {
  // src/index.ts
  var fileInput = document.querySelector("#fileInput");
  var runButton = document.querySelector("#runButton");
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("style", "display: none");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  }
  runButton.addEventListener("click", (event) => {
    fileInput.files?.item(0)?.arrayBuffer().then((buf) => {
      const blob = new Blob([buf], { type: "application/gbc" });
      download(blob, "out.gbc");
    });
  });
})();
