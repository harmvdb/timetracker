// DotMatrix — SVG dot-grid renderer voor cijfers en de dubbele punt
// Elke character is een 5×7 grid van cirkels

const DOT_SIZE = 6      // diameter van elke dot in px  (+20%)
const GAP = 3.6         // ruimte tussen dots            (+20%)
const STEP = DOT_SIZE + GAP

const COLS = 5
const ROWS = 7

// 5×7 bitmaps per karakter (rij voor rij, van boven naar onder)
const GLYPHS = {
  '0': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  '1': [
    [0,0,1,0,0],
    [0,1,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,1,1,1,0],
  ],
  '2': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [0,0,0,0,1],
    [0,0,1,1,0],
    [0,1,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  '3': [
    [1,1,1,1,0],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,1,1,1,0],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,1,1,1,0],
  ],
  '4': [
    [0,0,0,1,0],
    [0,0,1,1,0],
    [0,1,0,1,0],
    [1,0,0,1,0],
    [1,1,1,1,1],
    [0,0,0,1,0],
    [0,0,0,1,0],
  ],
  '5': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,1,1,1,0],
  ],
  '6': [
    [0,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  '7': [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [0,1,0,0,0],
    [0,1,0,0,0],
  ],
  '8': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  '9': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,1,1,1,0],
  ],
  ':': [
    [0,0,0,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,0,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,0,0,0],
  ],
}

const CHAR_W  = COLS * STEP               // breedte van één karakter incl. dots
const CHAR_H  = ROWS * STEP              // hoogte
const COLON_W = 3 * STEP                 // dubbele punt is smaller
const CHAR_GAP = 8                       // ruimte tussen karakters

function charWidth(ch) {
  return ch === ':' ? COLON_W : CHAR_W
}

function totalWidth(text) {
  let w = 0
  for (let i = 0; i < text.length; i++) {
    w += charWidth(text[i])
    if (i < text.length - 1) w += CHAR_GAP
  }
  return w
}

function GlyphSVG({ char, x, active, dotColor, dimColor }) {
  const glyph = GLYPHS[char]
  if (!glyph) return null
  const cols = char === ':' ? 3 : COLS
  const offsetX = char === ':' ? STEP : 0   // center the colon dots

  return (
    <>
      {glyph.map((row, r) =>
        row.slice(0, cols).map((on, c) => (
          <circle
            key={`${r}-${c}`}
            cx={x + offsetX + c * STEP + DOT_SIZE / 2}
            cy={r * STEP + DOT_SIZE / 2}
            r={DOT_SIZE / 2}
            fill={on ? dotColor : dimColor}
          />
        ))
      )}
    </>
  )
}

export default function DotMatrix({ text, active = false }) {
  const dotColor = active ? '#c8c8c8' : '#1e1e1e'
  const dimColor = active ? '#252525' : '#141414'

  const svgW = totalWidth(text)
  const svgH = CHAR_H

  let cursorX = 0

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {text.split('').map((ch, i) => {
        const x = cursorX
        const w = charWidth(ch)
        cursorX += w + CHAR_GAP
        return (
          <GlyphSVG
            key={i}
            char={ch}
            x={x}
            active={active}
            dotColor={dotColor}
            dimColor={dimColor}
          />
        )
      })}
    </svg>
  )
}
