import { useMemo } from 'react';

export default function SketchyBarcode({ value = '8813260400127', width = 220, height = 56 }) {
  const bars = useMemo(() => {
    const seed = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = (i) => {
      const x = Math.sin(seed + i * 13) * 10000;
      return x - Math.floor(x);
    };
    const arr = [];
    let x = 4;
    let i = 0;
    while (x < width - 4) {
      const w = 1 + Math.floor(rng(i) * 4);
      const skip = 1 + Math.floor(rng(i + 100) * 3);
      arr.push({ x, w });
      x += w + skip;
      i++;
    }
    return arr;
  }, [value, width]);

  return (
    <div style={{ display: 'inline-block', textAlign: 'center' }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={4} width={b.w} height={height - 20} fill="#1a1a1a" />
        ))}
      </svg>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 2, marginTop: -6 }}>{value}</div>
    </div>
  );
}
