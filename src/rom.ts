// ROM utilities

export {
    numGroups, groupSize, Game, romType, ptrSize, readPtr, readPtrTable,
    fixHeaderChecksum
};

import { isFirstInstance } from "./utils";

const bankAddrEnd = 0x7fff;
const bankAddrStart = 0x4000;
const checksumOffset = 0x14e;
const checuksumSize = 2;
const groupSize = 0x100;
const numGroups = 8;
const ptrSize = 2;

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

function isValidPtr(x: number): boolean {
    return x >= bankAddrStart && x <= bankAddrEnd;
}

function readPtr(
    rom: DataView, offset: number, littleEndian: boolean = true
): number {
    const ptr = rom.getUint16(offset, littleEndian)
    if (!isValidPtr(ptr)) {
        throw new Error("Read invalid pointer from ROM");
    }
    return ptr;
}

function readPtrTable(rom: DataView, offset: number, size: number): number[] {
    const ptrs = [...Array(size).keys()]
        .map((i) => readPtr(rom, offset + i * ptrSize))
        .filter(isFirstInstance);
    return ptrs;
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
