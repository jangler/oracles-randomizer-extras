// music shuffle

export { shuffleMusicInPlace };

import { Game, romType, formatOffset } from './rom';

const soundPointerTableOffsets = {
    [Game.Seasons]: (0x39 - 1) * 0x4000 + 0x57cf,
    [Game.Ages]: (0x39 - 1) * 0x4000 + 0x5748,
}
const soundPtrSize = 3;
const soundPtrAddrIsLittleEndian = true;

const unusedIndices = [0x00, 0x37, 0x3a, 0x3b, 0x41, 0x42, 0x43, 0x44, 0x45,
    0x47, 0x48, 0x49, 0x4b];

const jingleIndices = [0x06, 0x10, 0x40];

const gameSpecificIndices = {
    [Game.Seasons]: [0x3d],
    [Game.Ages]: [0x24, 0x30],
};

const baseMusicIndices = [...new Array(0x4c).keys()]
    .filter((i) => ![
        unusedIndices,
        jingleIndices,
        gameSpecificIndices[Game.Seasons],
        gameSpecificIndices[Game.Ages],
    ].some((indices) => indices.includes(i)));

function readSoundPtr(view: DataView, offset: number): [number, number] {
    const bankOffset = view.getUint8(offset);
    const addr = view.getUint16(offset + 1, soundPtrAddrIsLittleEndian);
    if (bankOffset > 0x3f || addr < 0x4000 || addr > 0x7fff) {
        const msg = 'Read invalid sound pointer at ' + formatOffset(offset);
        throw new Error(msg);
    }
    return [bankOffset, addr];
}

function writeSoundPtr(view: DataView, offset: number, ptr: [number, number]) {
    view.setUint8(offset, ptr[0]);
    view.setUint16(offset + 1, ptr[1], soundPtrAddrIsLittleEndian);
}

// https://stackoverflow.com/a/12646864
function shuffle<T>(array: T[]): T[] {
    const copy = array.slice(0);
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function shuffleMusicInPlace(rom: ArrayBuffer) {
    const game = romType(rom);
    const view = new DataView(rom);
    const offset = soundPointerTableOffsets[game];
    const musicIndices = baseMusicIndices.concat(gameSpecificIndices[game]);
    const ptrs = musicIndices
        .map((i) => readSoundPtr(view, offset + i * soundPtrSize));
    shuffle(ptrs).forEach((ptr, i) =>
        writeSoundPtr(view, offset + musicIndices[i] * soundPtrSize, ptr));
}
