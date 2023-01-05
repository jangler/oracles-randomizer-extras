// front-end

import { shuffleMusicInPlace } from "./music";
import { randomizeEnemies } from "./enemizer";
import { fixHeaderChecksum } from "./rom";

const generateButton =
    document.querySelector('#generateButton') as HTMLButtonElement;
const messageArea =
    document.querySelector('#messageArea') as HTMLParagraphElement;
const musicShuffleCheckbox =
    document.querySelector('#musicShuffleCheckbox') as HTMLInputElement;
const enemizerCheckbox =
    document.querySelector('#enemizerCheckbox') as HTMLInputElement;

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

generateButton.addEventListener('click', (event) => {
    const fileInput = document.querySelector('#fileInput') as HTMLInputElement;
    const file = fileInput.files?.item(0);
    if (file) {
        file.arrayBuffer().then((buf) => {
            clearError();
            try {
                if (musicShuffleCheckbox.checked) shuffleMusicInPlace(buf);
                if (enemizerCheckbox.checked) randomizeEnemies(buf);
                fixHeaderChecksum(buf);
                const blob = new Blob([buf], { type: 'application/gbc' });
                download(blob, file.name.replace('.gbc', '_extras.gbc'));
            } catch (err) {
                reportError(err);
            }
        });
    }
});
