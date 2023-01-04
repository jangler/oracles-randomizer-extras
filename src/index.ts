const fileInput = document.querySelector('#fileInput') as HTMLInputElement;
const runButton = document.querySelector('#runButton') as HTMLButtonElement;

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
    fileInput.files?.item(0)?.arrayBuffer().then((buf) => {
        const blob = new Blob([buf], { type: 'application/gbc' });
        download(blob, 'out.gbc');
    });
});
