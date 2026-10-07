// Generator for the dark-blue "provider button" map markers (PNG, 4x like the
// zwaa-hatch sprite). One normal state (app Button blue) and one selected
// state (app red accent). No deps: emits valid RGBA PNGs via node's zlib.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// (name, rgb) — blue[700] #0000C2 and grey[700] #595969 from the design tokens.
const MARKERS = [
    { name: 'provider-button', color: [0, 0, 194] },
    { name: 'provider-button-selected', color: [89, 89, 105] },
];

const W = 340; // image width  (sprites are pre-scaled 4x in this project)
const H = 64; // image height
const RADIUS = 44; // corner radius in image px (scaled 4x from ~11px)
const SS = 4; // supersampling factor for smooth edges

function pointInRoundedRect(px, py) {
    const r = RADIUS;
    const left = r;
    const right = W * SS - r;
    const top = r;
    const bot = H * SS - r;
    const core = (px >= left && px <= right) || (py >= top && py <= bot);
    if (core) return true;
    const cx = px < left ? left : right;
    const cy = py < top ? top : bot;
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= r * r;
}

// Super-sampled coverage buffer shared by all colors (shape only).
const SX = W * SS;
const SY = H * SS;
const coverage = Buffer.alloc(SX * SY);
for (let y = 0; y < SY; y++) {
    for (let x = 0; x < SX; x++) {
        coverage[y * SX + x] = pointInRoundedRect(x, y) ? 255 : 0;
    }
}

// --- minimal PNG encoder (RGBA, 8-bit) ---
const CRC_TABLE = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c;
    }
    return t;
})();
function crc32(buf) {
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
}
function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
}

function renderPng(color) {
    const out = Buffer.alloc(W * H * 4);
    for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
            let cov = 0;
            for (let sy = 0; sy < SS; sy++) {
                for (let sx = 0; sx < SS; sx++) {
                    cov += coverage[(py * SS + sy) * SX + (px * SS + sx)];
                }
            }
            cov /= SS * SS; // 0..255 average
            if (cov <= 0) continue;
            const i = (py * W + px) * 4;
            out[i] = color[0];
            out[i + 1] = color[1];
            out[i + 2] = color[2];
            out[i + 3] = Math.round(cov);
        }
    }

    const raw = Buffer.alloc((W * 4 + 1) * H);
    for (let y = 0; y < H; y++) {
        const rowStart = y * (W * 4 + 1);
        raw[rowStart] = 0;
        out.copy(raw, rowStart + 1, y * W * 4, (y + 1) * W * 4);
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(W, 0);
    ihdr.writeUInt32BE(H, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type RGBA
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw)),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

const here = dirname(fileURLToPath(import.meta.url));
const assetsDir = resolve(here, '../assets/map');
mkdirSync(assetsDir, { recursive: true });
for (const marker of MARKERS) {
    const dest = resolve(assetsDir, `${marker.name}-4x.png`);
    writeFileSync(dest, renderPng(marker.color));
    console.log('wrote', dest, W + 'x' + H);
}
