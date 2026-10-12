// Original 5 × 7 bitmap lettering. Each filled cell is a real rectangle;
// no installed font, image, network request, or Canvas text API is involved.
const ROWS = {
  ' ': '00000/00000/00000/00000/00000/00000/00000',
  '0': '01110/10011/10101/10101/11001/10001/01110',
  '1': '00100/01100/00100/00100/00100/00100/01110',
  '2': '01110/10001/00001/00010/00100/01000/11111',
  '3': '11110/00001/00001/01110/00001/00001/11110',
  '4': '00010/00110/01010/10010/11111/00010/00010',
  '5': '11111/10000/10000/11110/00001/00001/11110',
  '6': '01110/10000/10000/11110/10001/10001/01110',
  '7': '11111/00001/00010/00100/01000/01000/01000',
  '8': '01110/10001/10001/01110/10001/10001/01110',
  '9': '01110/10001/10001/01111/00001/00001/01110',
  A: '01110/10001/10001/11111/10001/10001/10001',
  B: '11110/10001/10001/11110/10001/10001/11110',
  C: '01111/10000/10000/10000/10000/10000/01111',
  D: '11110/10001/10001/10001/10001/10001/11110',
  E: '11111/10000/10000/11110/10000/10000/11111',
  F: '11111/10000/10000/11110/10000/10000/10000',
  G: '01111/10000/10000/10111/10001/10001/01111',
  H: '10001/10001/10001/11111/10001/10001/10001',
  I: '01110/00100/00100/00100/00100/00100/01110',
  J: '00111/00010/00010/00010/10010/10010/01100',
  K: '10001/10010/10100/11000/10100/10010/10001',
  L: '10000/10000/10000/10000/10000/10000/11111',
  M: '10001/11011/10101/10101/10001/10001/10001',
  N: '10001/11001/11001/10101/10011/10011/10001',
  O: '01110/10001/10001/10001/10001/10001/01110',
  P: '11110/10001/10001/11110/10000/10000/10000',
  Q: '01110/10001/10001/10001/10101/10010/01101',
  R: '11110/10001/10001/11110/10100/10010/10001',
  S: '01111/10000/10000/01110/00001/00001/11110',
  T: '11111/00100/00100/00100/00100/00100/00100',
  U: '10001/10001/10001/10001/10001/10001/01110',
  V: '10001/10001/10001/10001/10001/01010/00100',
  W: '10001/10001/10001/10101/10101/10101/01010',
  X: '10001/10001/01010/00100/01010/10001/10001',
  Y: '10001/10001/01010/00100/00100/00100/00100',
  Z: '11111/00001/00010/00100/01000/10000/11111',
  '-': '00000/00000/00000/11111/00000/00000/00000',
  '?': '01110/10001/00001/00010/00100/00000/00100',
  '!': '00100/00100/00100/00100/00100/00000/00100',
  ':': '00000/00100/00100/00000/00100/00100/00000',
  '.': '00000/00000/00000/00000/00000/00100/00100',
  '/': '00001/00001/00010/00100/01000/10000/10000',
  '+': '00000/00100/00100/11111/00100/00100/00000',
};
const GLYPHS = Object.freeze(Object.fromEntries(Object.entries(ROWS).map(
  ([key, rows]) => [key, Object.freeze(rows.split('/').map(row => parseInt(row, 2)))],
)));
const WIDTH = 5, HEIGHT = 7, MAX_CHARACTERS = 64;
const finite = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const integer = (value, fallback, min, max) => Math.min(max, Math.max(min, Math.round(finite(value, fallback))));

function layout(text, options = {}) {
  // Slice before uppercasing/iteration so even an accidental huge label is bounded.
  const source = String(text ?? '');
  const characters = Array.from(source.slice(0, MAX_CHARACTERS * 2).toUpperCase());
  const truncated = characters.length > MAX_CHARACTERS || source.length > MAX_CHARACTERS * 2;
  const chosen = characters.slice(0, MAX_CHARACTERS);
  let unsupported = 0;
  const glyphs = chosen.map(character => {
    if (!Object.hasOwn(GLYPHS, character)) unsupported++;
    return Object.hasOwn(GLYPHS, character) ? character : '?';
  });
  const spacing = integer(options.spacing, 1, 0, 4);
  const cells = glyphs.length ? glyphs.length * WIDTH + (glyphs.length - 1) * spacing : 0;
  let scale = integer(options.scale, 3, 1, 12);
  if (typeof options.maxWidth === 'number' && Number.isFinite(options.maxWidth) && options.maxWidth > 0 && cells) {
    scale = Math.max(1, Math.min(scale, Math.floor(options.maxWidth / cells)));
  }
  return { glyphs, spacing, scale, width: cells * scale, height: glyphs.length ? HEIGHT * scale : 0, unsupported, truncated };
}

/** Layout in Canvas coordinate units. maxWidth reduces integer scale, never below 1. */
export function measurePixelText(text, options = {}) {
  const { glyphs, spacing, ...bounds } = layout(text, options);
  return { ...bounds, characters: glyphs.length, spacing };
}

/**
 * Draw true bitmap letters. x/y are an alignment anchor; returned x/y are the
 * integer top-left. shadow dx/dy are whole bitmap cells, bounded to ±4 cells.
 * Width/height describe the label; paintBounds also includes an optional shadow.
 * For a responsive badge: drawPixelText(ctx, '1-1', w / 2, 16, {align:'center', scale:3}).
 */
export function drawPixelText(ctx, text, x, y, options = {}) {
  if (!ctx || typeof ctx.save !== 'function' || typeof ctx.restore !== 'function' || typeof ctx.fillRect !== 'function') {
    throw new TypeError('drawPixelText requires a Canvas 2D context');
  }
  const metrics = layout(text, options);
  const { glyphs, spacing, scale, width, height, unsupported, truncated } = metrics;
  const horizontal = options.align === 'center' ? width / 2 : options.align === 'right' ? width : 0;
  const vertical = options.valign === 'middle' ? height / 2 : options.valign === 'bottom' ? height : 0;
  const left = Math.round(finite(x, 0) - horizontal), top = Math.round(finite(y, 0) - vertical);
  const shadow = typeof options.shadow?.color === 'string' && options.shadow.color ? options.shadow : null;
  const sx = shadow ? integer(shadow.dx, 1, -4, 4) * scale : 0;
  const sy = shadow ? integer(shadow.dy, 1, -4, 4) * scale : 0;
  const bounds = {
    x: left, y: top, width, height, scale, characters: glyphs.length, spacing, unsupported, truncated,
    paintBounds: { x: left + Math.min(0, sx), y: top + Math.min(0, sy), width: width + Math.abs(sx), height: height + Math.abs(sy) },
  };
  if (!glyphs.length) return bounds;
  const paint = (color, dx, dy) => {
    ctx.fillStyle = color;
    for (let i = 0; i < glyphs.length; i++) {
      const rows = GLYPHS[glyphs[i]], gx = left + i * (WIDTH + spacing) * scale + dx;
      for (let row = 0; row < HEIGHT; row++) for (let col = 0; col < WIDTH; col++) {
        if (rows[row] & (1 << (WIDTH - 1 - col))) ctx.fillRect(gx + col * scale, top + row * scale + dy, scale, scale);
      }
    }
  };
  ctx.save();
  try {
    if (shadow) paint(shadow.color, sx, sy);
    paint(typeof options.color === 'string' && options.color ? options.color : '#286864', 0, 0);
  } finally {
    ctx.restore();
  }
  return bounds;
}
