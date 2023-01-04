(() => {
  // src/lib.ts
  var musicBankOffset = 3 * 16384;
  var musicTableOffsets = {
    [0 /* Seasons */]: musicBankOffset + 18492,
    [1 /* Ages */]: musicBankOffset + 18780
  };
  var numGroups = 8;
  var groupSize = 256;
  var ptrSize = 2;
  var bankAddrStart = 16384;
  var bankAddrEnd = 32767;
  var maxMusicValue = 70;
  function romType(rom) {
    const title = Array.from(new Uint8Array(rom.slice(308, 323))).filter((x) => x !== 0).map((x) => String.fromCharCode(x)).join("");
    switch (title) {
      case "ZELDA DINAZ7E":
        return 0 /* Seasons */;
      case "ZELDA NAYRUAZ8E":
        return 1 /* Ages */;
    }
    return new Error("Unrecognized ROM title: " + title);
  }
  function readPtr(rom, offset) {
    return rom.getInt16(offset, true);
  }
  function isFirstInstance(value, index, array) {
    return array.indexOf(value) === index;
  }
  function isValidGroupPtr(x) {
    return x >= bankAddrStart && x <= bankAddrEnd - groupSize;
  }
  function shuffle(array) {
    const copy = array.slice(0);
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function readMusicGroupPtrs(rom, game) {
    return [...Array(numGroups).keys()].map((i) => readPtr(rom, musicTableOffsets[game] + i * ptrSize)).filter(isFirstInstance);
  }
  function readUniqueMusicValues(rom, ptrs) {
    return ptrs.flatMap((ptr) => {
      const offset = musicBankOffset + ptr;
      const slice = rom.slice(offset, offset + groupSize);
      return Array.from(new Uint8Array(slice));
    }).filter(isFirstInstance);
  }
  function createShuffleMap(pool) {
    const shuffledPool = shuffle(pool);
    return new Map(pool.map((x, i) => [x, shuffledPool[i]]));
  }
  function replaceMusicValues(rom, ptrs, map) {
    for (const ptr of ptrs) {
      for (let room = 0; room < groupSize; room++) {
        const offset = musicBankOffset + ptr + room;
        rom.setUint8(offset, map.get(rom.getUint8(offset)));
      }
    }
  }
  function shuffleMusicInPlace(rom) {
    const game = romType(rom);
    if (game instanceof Error)
      return game;
    const view = new DataView(rom);
    const musicGroupPtrs = readMusicGroupPtrs(view, game);
    const unqiueMusicValues = readUniqueMusicValues(rom, musicGroupPtrs);
    if (!musicGroupPtrs.every(isValidGroupPtr) || unqiueMusicValues.some((x) => x > maxMusicValue)) {
      return new Error("Could not read music table");
    }
    const musicMap = createShuffleMap(unqiueMusicValues);
    console.log(musicMap);
    replaceMusicValues(view, musicGroupPtrs, musicMap);
  }

  // src/index.ts
  var runButton = document.querySelector("#runButton");
  var messageArea = document.querySelector("#messageArea");
  function reportError(err) {
    messageArea.setAttribute("style", "display: block;");
    messageArea.innerText = err.message + ".";
  }
  function clearError() {
    messageArea.setAttribute("style", "display: none;");
  }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("style", "display: none");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  }
  runButton.addEventListener("click", (event) => {
    const fileInput = document.querySelector("#fileInput");
    const file = fileInput.files?.item(0);
    if (file) {
      file.arrayBuffer().then((buf) => {
        const err = shuffleMusicInPlace(buf);
        if (err) {
          reportError(err);
        } else {
          clearError();
          const blob = new Blob([buf], { type: "application/gbc" });
          download(blob, file.name.replace(".gbc", "_extras.gbc"));
        }
      });
    }
  });
})();
