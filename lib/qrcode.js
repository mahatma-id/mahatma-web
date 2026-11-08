/**
 * Pure-JS ISO/IEC 18004 QR Code SVG Path Generator (Error Correction Level L, Byte Mode, Versions 1..10)
 * Menghasilkan matriks QR Code vektor tajam (<svg>) secara sinkron tanpa ketergantungan jaringan eksternal.
 */

// Tabel kapasitas data (Byte mode, ECC Level L) dan jumlah ECC codewords untuk Version 1..10
const VERSION_INFO = [
  null,
  { totalCodewords: 26, ecCodewordsPerBlock: 7, blocks: 1 },   // v1 (21x21)
  { totalCodewords: 44, ecCodewordsPerBlock: 10, blocks: 1 },  // v2 (25x25)
  { totalCodewords: 70, ecCodewordsPerBlock: 15, blocks: 1 },  // v3 (29x29)
  { totalCodewords: 100, ecCodewordsPerBlock: 20, blocks: 1 }, // v4 (33x33)
  { totalCodewords: 134, ecCodewordsPerBlock: 26, blocks: 1 }, // v5 (37x37)
  { totalCodewords: 172, ecCodewordsPerBlock: 18, blocks: 2 }, // v6 (41x41)
  { totalCodewords: 196, ecCodewordsPerBlock: 20, blocks: 2 }, // v7 (45x45)
  { totalCodewords: 242, ecCodewordsPerBlock: 24, blocks: 2 }, // v8 (49x49)
  { totalCodewords: 292, ecCodewordsPerBlock: 30, blocks: 2 }, // v9 (53x53)
  { totalCodewords: 346, ecCodewordsPerBlock: 18, blocks: 4 }, // v10 (57x57)
];

const ALIGNMENT_PATTERNS = [
  null,
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

// GF(256) tables
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

function getGeneratorPoly(degree) {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = EXP_TABLE[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function computeReedSolomon(data, ecLen) {
  const gen = getGeneratorPoly(ecLen);
  const res = new Uint8Array(ecLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    for (let j = 0; j < ecLen - 1; j++) {
      res[j] = res[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    res[ecLen - 1] = gfMul(gen[ecLen], factor);
  }
  return res;
}

function getBCHFormatInfo(data) {
  let d = data << 10;
  while (getBitLength(d) - getBitLength(0x537) >= 0) {
    d ^= 0x537 << (getBitLength(d) - getBitLength(0x537));
  }
  return ((data << 10) | d) ^ 0x5412;
}

function getBCHVersionInfo(version) {
  let d = version << 12;
  while (getBitLength(d) - getBitLength(0x1f25) >= 0) {
    d ^= 0x1f25 << (getBitLength(d) - getBitLength(0x1f25));
  }
  return (version << 12) | d;
}

function getBitLength(n) {
  let len = 0;
  while (n > 0) {
    len++;
    n >>>= 1;
  }
  return len;
}

export function generateQrMatrix(text) {
  const utf8Bytes = new TextEncoder().encode(text);
  let version = 1;
  while (version <= 10) {
    const info = VERSION_INFO[version];
    const dataCap = info.totalCodewords - info.ecCodewordsPerBlock * info.blocks;
    const headerBits = version <= 9 ? 12 : 20; // 4 mode + 8/16 length
    if (utf8Bytes.length * 8 + headerBits <= dataCap * 8) break;
    version++;
  }
  if (version > 10) version = 10;

  const info = VERSION_INFO[version];
  const dataCapacityBytes = info.totalCodewords - info.ecCodewordsPerBlock * info.blocks;
  const payload = utf8Bytes.slice(0, dataCapacityBytes - 3);

  // Bit buffer
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  // Mode: Byte (0100)
  pushBits(0b0100, 4);
  pushBits(payload.length, version <= 9 ? 8 : 16);
  for (let i = 0; i < payload.length; i++) {
    pushBits(payload[i], 8);
  }

  // Terminator
  const maxBits = dataCapacityBytes * 8;
  for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes = new Uint8Array(dataCapacityBytes);
  for (let i = 0; i < bits.length / 8; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
    dataBytes[i] = b;
  }
  let padIdx = bits.length / 8;
  let padToggle = true;
  while (padIdx < dataCapacityBytes) {
    dataBytes[padIdx++] = padToggle ? 0xec : 0x11;
    padToggle = !padToggle;
  }

  // Split blocks & compute ECC
  const blocks = info.blocks;
  const blockDataLen = Math.floor(dataCapacityBytes / blocks);
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let b = 0; b < blocks; b++) {
    const slice = dataBytes.slice(offset, offset + blockDataLen);
    offset += blockDataLen;
    dataBlocks.push(slice);
    ecBlocks.push(computeReedSolomon(slice, info.ecCodewordsPerBlock));
  }

  const finalCodewords = [];
  for (let i = 0; i < blockDataLen; i++) {
    for (let b = 0; b < blocks; b++) finalCodewords.push(dataBlocks[b][i]);
  }
  for (let i = 0; i < info.ecCodewordsPerBlock; i++) {
    for (let b = 0; b < blocks; b++) finalCodewords.push(ecBlocks[b][i]);
  }

  // Build Matrix
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(null));

  const placeFinderPattern = (row, col) => {
    for (let r = -1; r <= 7; r++) {
      if (row + r < 0 || row + r >= size) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c < 0 || col + c >= size) continue;
        if (
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          modules[row + r][col + c] = true;
        } else {
          modules[row + r][col + c] = false;
        }
      }
    }
  };

  placeFinderPattern(0, 0);
  placeFinderPattern(size - 7, 0);
  placeFinderPattern(0, size - 7);

  // Alignment patterns
  const pos = ALIGNMENT_PATTERNS[version];
  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      const row = pos[i];
      const col = pos[j];
      if (modules[row][col] !== null) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          modules[row + r][col + c] =
            r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0);
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (modules[i][6] === null) modules[i][6] = i % 2 === 0;
    if (modules[6][i] === null) modules[6][i] = i % 2 === 0;
  }

  // Reserve format info & dark module
  for (let i = 0; i < 9; i++) {
    if (modules[8][i] === null) modules[8][i] = false;
    if (modules[i][8] === null) modules[i][8] = false;
  }
  for (let i = 0; i < 8; i++) {
    if (modules[8][size - 1 - i] === null) modules[8][size - 1 - i] = false;
    if (modules[size - 1 - i][8] === null) modules[size - 1 - i][8] = false;
  }
  modules[size - 8][8] = true;

  if (version >= 7) {
    const vBits = getBCHVersionInfo(version);
    for (let i = 0; i < 18; i++) {
      const bit = ((vBits >>> i) & 1) === 1;
      modules[Math.floor(i / 3)][(i % 3) + size - 11] = bit;
      modules[(i % 3) + size - 11][Math.floor(i / 3)] = bit;
    }
  }

  // Place data bits with Mask 0 ((row + col) % 2 === 0)
  let byteIdx = 0;
  let bitIdx = 7;
  let inc = -1;
  let row = size - 1;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    while (true) {
      for (let c = 0; c < 2; c++) {
        if (modules[row][col - c] === null) {
          let dark = false;
          if (byteIdx < finalCodewords.length) {
            dark = ((finalCodewords[byteIdx] >>> bitIdx) & 1) === 1;
            bitIdx--;
            if (bitIdx === -1) {
              byteIdx++;
              bitIdx = 7;
            }
          }
          if ((row + (col - c)) % 2 === 0) dark = !dark;
          modules[row][col - c] = dark;
        }
      }
      row += inc;
      if (row < 0 || row >= size) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }

  // Write Format Info (ECC Level L = 01, Mask = 000 -> data = 0b01000 = 8)
  const formatBits = getBCHFormatInfo(0b01000);
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >>> i) & 1) === 1;
    // Vertical
    if (i < 6) modules[i][8] = bit;
    else if (i < 8) modules[i + 1][8] = bit;
    else modules[size - 15 + i][8] = bit;
    // Horizontal
    if (i < 8) modules[8][size - i - 1] = bit;
    else if (i < 9) modules[8][15 - i - 1 + 1] = bit;
    else modules[8][15 - i - 1] = bit;
  }

  return modules;
}
