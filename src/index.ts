import { romTitle } from "./lib";

const fileInput = document.querySelector('#fileInput') as HTMLInputElement;
const output = document.querySelector('#output') as HTMLParagraphElement;

fileInput.addEventListener('change', (event) => {
    fileInput.files?.item(0)?.arrayBuffer().then((buf) => {
        output.textContent = romTitle(new Uint8Array(buf));
    })
})
