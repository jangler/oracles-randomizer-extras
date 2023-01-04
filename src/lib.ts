export function romTitle(rom: Uint8Array): string {
    return Array.from(rom.slice(0x134, 0x13f))
        .map((x) => String.fromCharCode(x))
        .join("");
}
