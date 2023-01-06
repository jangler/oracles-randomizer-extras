// front-end

import { shuffleMusic, shuffleSfx } from "./audio";
import { fixHeaderChecksum } from "./rom";

const generateButton =
    document.querySelector('#generateButton') as HTMLButtonElement;
const messageArea =
    document.querySelector('#messageArea') as HTMLParagraphElement;
const musicShuffleCheckbox =
    document.querySelector('#musicShuffleCheckbox') as HTMLInputElement;
const sfxShuffleCheckbox =
    document.querySelector('#sfxShuffleCheckbox') as HTMLInputElement;
const changelogButton =
    document.querySelector('#changelogButton') as HTMLButtonElement;
const changelog =
    document.querySelector('#changelog') as HTMLElement;

let changelogShown = false;

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
                if (musicShuffleCheckbox.checked) shuffleMusic(buf);
                if (sfxShuffleCheckbox.checked) shuffleSfx(buf);
                fixHeaderChecksum(buf);
                const blob = new Blob([buf], { type: 'application/gbc' });
                download(blob, file.name.replace('.gbc', '_extras.gbc'));
            } catch (err) {
                reportError(err);
            }
        });
    }
});

changelogButton.addEventListener('click', (event) => {
    if (changelogShown) {
        changelog.setAttribute('style', 'display: none');
        changelogButton.textContent = 'Show changelog';
    } else {
        changelog.setAttribute('style', 'display: block');
        changelogButton.textContent = 'Hide changelog';
    }
    changelogShown = !changelogShown;
})
