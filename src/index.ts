import { shuffleMusicInPlace } from "./lib";

const runButton = document.querySelector('#runButton') as HTMLButtonElement;
const messageArea =
    document.querySelector('#messageArea') as HTMLParagraphElement;

function reportError(err: Error) {
    messageArea.setAttribute('style', 'display: block;');
    messageArea.innerText = err.message + '.';
}

function clearError() {
    messageArea.setAttribute('style', 'display: none;')
}

// https://stackoverflow.com/questions/19327749/
function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('style', 'display: none');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
}

// currently, this downloads the same file with no modification.
runButton.addEventListener('click', (event) => {
    const fileInput = document.querySelector('#fileInput') as HTMLInputElement;
    const file = fileInput.files?.item(0);
    if (file) {
        file.arrayBuffer().then((buf) => {
            const err = shuffleMusicInPlace(buf);
            if (err) {
                reportError(err);
            } else {
                clearError();
                const blob = new Blob([buf], { type: 'application/gbc' });
                download(blob, file.name.replace('.gbc', '_extras.gbc'));
            }
        });
    }
});
