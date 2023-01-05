// music shuffle

export { shuffleMusicInPlace };

import { Game, romType, readPtr } from './rom';

const musicBankOffset = 0x03 * 0x4000;
const musicTableOffsets = {
    [Game.Seasons]: musicBankOffset + 0x483c,
    [Game.Ages]: musicBankOffset + 0x495c,
}

const numGroups = 8;
const groupSize = 0x100;
const ptrSize = 2;
const bankAddrStart = 0x4000;
const bankAddrEnd = 0x7fff;
const maxMusicValue = 0x46;

function isFirstInstance<T>(value: T, index: number, array: T[]): boolean {
    return array.indexOf(value) === index;
}

function isValidGroupPtr(x: number): boolean {
    return x >= bankAddrStart && x <= bankAddrEnd - groupSize;
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

function readMusicGroupPtrs(rom: DataView, game: Game): number[] {
    return [...Array(numGroups).keys()]
        .map((i) => readPtr(rom, musicTableOffsets[game] + i * ptrSize))
        .filter(isFirstInstance);
}

function readUniqueMusicValues(rom: ArrayBuffer, ptrs: number[]): number[] {
    return ptrs.flatMap((ptr) => {
        const offset = musicBankOffset + ptr;
        const slice = rom.slice(offset, offset + groupSize);
        return Array.from(new Uint8Array(slice));
    }).filter(isFirstInstance);
}

function createShuffleMap<T>(pool: T[]): Map<T, T> {
    const shuffledPool = shuffle(pool);
    return new Map(pool.map((x, i) => [x, shuffledPool[i]]));
}

function replaceMusicValues(
    rom: DataView, ptrs: number[], map: Map<number, number>
) {
    for (const ptr of ptrs) {
        for (let room = 0; room < groupSize; room++) {
            const offset = musicBankOffset + ptr + room;
            rom.setUint8(offset, map.get(rom.getUint8(offset)) as number);
        }
    }
}

// one potential caveat to this approach is that music values not present in
// the music-by-room table (if there are any) don't participate in the shuffle.
function shuffleMusicInPlace(rom: ArrayBuffer) {
    const game = romType(rom);
    const view = new DataView(rom);

    const musicGroupPtrs = readMusicGroupPtrs(view, game);
    const unqiueMusicValues = readUniqueMusicValues(rom, musicGroupPtrs);
    if (!musicGroupPtrs.every(isValidGroupPtr)
        || unqiueMusicValues.some((x) => x > maxMusicValue)) {
        throw new Error("Could not read music table");
    }

    const musicMap = createShuffleMap(unqiueMusicValues);
    replaceMusicValues(view, musicGroupPtrs, musicMap);
}
