// ROM utilities

export { Game, romType, readPtr, fixHeaderChecksum }

const checksumOffset = 0x14e;
const checuksumSize = 2;

enum Game { Seasons, Ages }

function romType(rom: ArrayBuffer): Game {
    const title = Array.from(new Uint8Array(rom.slice(0x134, 0x143)))
        .filter((x) => x !== 0)
        .map((x) => String.fromCharCode(x))
        .join("");
    switch (title) {
        case "ZELDA DINAZ7E": return Game.Seasons;
        case "ZELDA NAYRUAZ8E": return Game.Ages;
    }
    throw new Error("Unrecognized ROM title: " + title);
}

function readPtr(rom: DataView, offset: number): number {
    return rom.getInt16(offset, true);
}

function byteSum16(xs: Uint8Array): number {
    let sum = 0;
    for (const x of xs) sum = (sum + x) % 0x10000;
    return sum;
}

function fixHeaderChecksum(rom: ArrayBuffer) {
    const bytes = new Uint8Array(rom);
    const sum = (
        byteSum16(bytes.slice(0, checksumOffset))
        + byteSum16(bytes.slice(checksumOffset + checuksumSize))
    ) % 0x10000;
    new DataView(rom).setUint16(checksumOffset, sum, false);
}
