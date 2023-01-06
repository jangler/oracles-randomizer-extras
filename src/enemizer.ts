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

// enemy variables to consider for logic:
// - where the enemy can move
// - how the enemy can be killed
// - whether the enemy is top-down or sidescrolling
// - whether the enemy can be switched with
// - whether the enemy works in small or large rooms

// the best way to do this without getting into room-specific logic is probably
// to have a logic tree with leaves that can represent enemies (RiverZora,
// Octorok), collisions between items and enemies (SwordPush, RodDamage), and
// intermediate steps (CommonVulnerabilities). enemies could only be replaced
// by enemies that support a superset of the original enemy's collisions.
// land/sea/air, topdown/sidescrolling, and small/large can be represented by
// similar trees.

const supportedIDs = [
    0x08, // river zora
    0x09, // octorok
    0x0a, // boomerang moblin
    0x0c, // arrow moblin
    0x0d, // lynel
    0x10, // rope
    0x12, // gibdo
    0x13, // spark
    0x14, // spiked beetle
    0x15, // bubble
    0x16, // beamos
    0x17, // ghini
    0x18, // buzz blob
    0x19, // whisp?
    0x1a, // sand crab
    0x1c, // iron mask
    0x1e, // piranha
    0x20, // masked moblin
    0x21, // arrow darknut
    0x22, // shrouded stalfos
    0x23, // pols voice
    0x25, // goponga flower
    0x26, // angler fish
    0x29, // podoboo
    0x2d, // podoboo tower
    0x30, // tektite
    0x31, // stalfos
    0x32, // keese
    0x39, // fire keese
    0x3a, // water tektite
    0x3c, // bari (ages) / magunesu (seasons)
    0x3d, // sword moblin
    0x3e, // peahat
    0x40, // wizzrobe
    0x43, // gel
    0x45, // pincer
    0x48, // sword darknut
    0x49, // sword shrouded stalfos
    0x4a, // sword masked moblin
    0x4b, // ball and chain soldier
    0x4c, // blue crow
    0x4d, // hardhat beetle
    0x4e, // arm mimic
    0x4f, // moldorm
    0x55, // candle
]

const ignoredIDs = [
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, // bosses
    0x0b, // leever (not coded for large rooms)
    0x0e, // blade trap
    0x11, // eyesoar child
    0x14, // spiked beetle (requires multiple items)
    0x1d, // armos spawner
    0x1b, // spiny beetle (two-part enemy)
    0x24, // like-like (could be spawner)
    0x27, // deku scrub (only works outdoors)
    0x28, // wallmaster (X/Y behave specially)
    0x2a, // giant blade trap
    0x2b, // sidescroll down transition
    0x2c, // cheep cheep (sidescroll)
    0x2e, // thwimp
    0x2f, // thwomp
    0x33, // baby cucco (not coded for large rooms)
    0x34, // zol
    0x35, // floormaster
    0x36, // cucco (not coded for large rooms)
    0x37, // butterfly
    0x38, // great fairy
    0x3b, // giant cucco (bugged in ages)
    0x41, // crow (not coded for large rooms)
    0x47, // color-changing gel
    0x50, // fireball shooter
    0x51, // beetle (could be spawner)
    0x52, // flying tile
    0x53, // dragonfly
    0x54, // ambi guard
    0x56, // decorative moblin
    0x58, // bush or rock (for spiny beetle, deku scrub)
    0x59, // item drop producer
    0x5a, // seeds on tree
    0x5c, // unknown, disasm says "stub"
    0x62, // vine sprout
    0x63, // target cart crystal
    0x68, 0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f, // bosses
    0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, // bosses
    0x78, 0x79, 0x7a, 0x7b, 0x7c, 0x7d, 0x7e, 0x7f, // bosses
];

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

function randomChoice<T>(xs: T[]): T {
    return xs[Math.floor(Math.random() * xs.length)];
}

function randomizeEnemies(rom: ArrayBuffer) {
    const game = romType(rom);
    const view = new DataView(rom);
    const bankOffset = objectBankOffsets[game];
    const entityOffsets = readRoomAddrs(view, game)
        .flatMap((addr) => readEntityAddrs(view, bankOffset, addr))
        .filter(isFirstInstance)
        .filter((offset) => supportedIDs.includes(view.getUint8(offset)));
    const entityPool = entityOffsets
        .map((offset) => view.getUint16(offset));
    for (const offset of entityOffsets) {
        view.setUint16(offset, randomChoice(entityPool));
    }
}
