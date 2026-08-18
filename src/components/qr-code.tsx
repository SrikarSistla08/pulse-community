function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export default function QrCode({ value, size = 88 }: { value: string; size?: number }) {
  const cells = 17
  const seed = hash(value)
  const matrix: boolean[][] = []

  for (let y = 0; y < cells; y++) {
    const row: boolean[] = []
    for (let x = 0; x < cells; x++) {
      const corner =
        (x < 5 && y < 5) || (x >= cells - 5 && y < 5) || (x < 5 && y >= cells - 5)
      if (corner) {
        const inner =
          (x >= 1 && x < 4 && y >= 1 && y < 4) ||
          (x >= cells - 4 && x < cells - 1 && y >= 1 && y < 4) ||
          (x >= 1 && x < 4 && y >= cells - 4 && y < cells - 1)
        row.push(!inner && ((x + y) % 2 === 0))
      } else {
        const n = (seed + x * 31 + y * 131) % 1000
        row.push(n % 3 !== 0)
      }
    }
    matrix.push(row)
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${cells} ${cells}`} shapeRendering="crispEdges">
      {matrix.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="var(--fg)" />
          ) : null
        )
      )}
    </svg>
  )
}
