// enemy shuffle

export { randomizeEnemies };

import { isFirstInstance } from './utils';
import {
    Game, romType, readPtr, readPtrTable, numGroups, groupSize, ptrSize
} from './rom';

const groupBankOffsets = {
    [Game.Seasons]: 0x10 * 0x4000,
    [Game.Ages]: 0x14 * 0x4000,
}
const groupTableAddrs = {
    [Game.Seasons]: 0x5b3b,
    [Game.Ages]: 0x432b,
}
const objectBankOffsets = {
    [Game.Seasons]: 0x10 * 0x4000,
    [Game.Ages]: 0x11 * 0x4000,
}

// returns pointers to the start of each room's object list
function readRoomAddrs(rom: DataView, game: Game): number[] {
    const bankOffset = groupBankOffsets[game];
    const offset = bankOffset + groupTableAddrs[game];
    return readPtrTable(rom, offset, numGroups)
        .filter(isFirstInstance)
        .flatMap((addr) => readPtrTable(rom, bankOffset + addr, groupSize))
        .filter(isFirstInstance);
}

function isEndByte(x: number): boolean {
    return x === 0xff || x === 0xfe;
}

// used for parsing objects not related to the enemizer
function skipOpcode(rom: DataView, offset: number, size: number): number {
    while (rom.getUint8(offset) < 0xf0) {
        offset += size;
    }
    return offset;
}

function takeOpcode(
    rom: DataView, offset: number, size: number
): [number, number[]] {
    let addrs: number[] = [];
    while (rom.getUint8(offset) < 0xf0) {
        addrs.push(offset);
        offset += size;
    }
    return [offset, addrs];
}

// returns [new offset, found entity addrs]
function readObject(
    rom: DataView, bankOffset: number, offset: number
): [number, number[]] {
    const mode = rom.getUint8(offset);
    offset++;

    switch (mode) {
        case 0xf0:
            return [offset + 1, []];
        case 0xf1:
            return [skipOpcode(rom, offset + 1, 2), []];
        case 0xf2:
            return [skipOpcode(rom, offset, 4), []];
        case 0xf3:
        case 0xf4:
        case 0xf5:
            let ptr: number;
            try {
                ptr = readPtr(rom, offset, true);
            } catch (err) {
                // seasons seems to have one invalid pointer?
                return [offset + ptrSize, []];
            }
            return [offset + ptrSize, readEntityAddrs(rom, bankOffset, ptr)];
        case 0xf6:
            return takeOpcode(rom, offset + 1, 2);
        case 0xf7:
            return takeOpcode(rom, offset + 1, 4);
        case 0xf8:
            return [skipOpcode(rom, offset, 3), []];
        case 0xf9:
            return [skipOpcode(rom, offset, 6), []];
        case 0xfa:
            return [skipOpcode(rom, offset + 1, 2), []];
        default:
            throw new Error('Read invalid object from ROM');
    }
}

// returns pointers to the each entity's id/subid bytes
function readEntityAddrs(
    rom: DataView, bankOffset: number, addr: number
): number[] {
    let addrs: number[] = [];
    let offset = bankOffset + addr;

    while (!isEndByte(rom.getUint8(offset))) {
        let [newOffset, newAddrs] = readObject(rom, bankOffset, offset);
        offset = newOffset;
        addrs.push(...newAddrs);
    }

    return addrs.filter(isFirstInstance);
}

function randomizeEnemies(rom: ArrayBuffer) {
    const game = romType(rom);
    const view = new DataView(rom);
    const objectBankOffset = objectBankOffsets[game];
    const entityAddrs = readRoomAddrs(view, game)
        .flatMap((addr) => readEntityAddrs(view, objectBankOffset, addr))
        .filter(isFirstInstance);
}
