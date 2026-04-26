const PACKER_COLORS = ['#e8692b', '#2b6ce8', '#5c8a3a', '#d94a8a'];

function Doughnut({ pct, size = 130, stroke = 14, color }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * Math.min(pct, 1);
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8e8e0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
}

export default function PackerDashboard({ catalogByPacker, boxes, itemsByBox, PACKERS, scanProgress = {} }) {
  const hasCatalog = Object.keys(catalogByPacker).length > 0;

  const packerStats = PACKERS.map((p, i) => {
    const assigned = catalogByPacker[p.code] || [];
    const need = assigned.reduce((s, it) => s + (it.qty || 0), 0);

    const myBoxes = boxes.filter(b =>
      b.packer?.code === p.code &&
      (b.status === 'closed' || b.status === 'exported' || b.status === 'received')
    );
    const gotClosed = myBoxes.reduce((s, b) => {
      const items = itemsByBox[b.id] || [];
      return s + items.reduce((ss, it) => ss + (it.qty || it.got || 0), 0);
    }, 0);
    const gotInProgress = Object.entries(scanProgress)
      .filter(([boxId]) => boxes.find(b => b.id === boxId)?.packer?.code === p.code)
      .flatMap(([, items]) => items)
      .reduce((s, it) => s + it.got, 0);
    const got = gotClosed + gotInProgress;

    const pct = need > 0 ? got / need : 0;
    const color = PACKER_COLORS[i % PACKER_COLORS.length];

    return { ...p, need, got, pct, color, closedBoxes: myBoxes.length, skuCount: assigned.length };
  });

  const totalNeed = packerStats.reduce((s, p) => s + p.need, 0);
  const totalGot  = packerStats.reduce((s, p) => s + p.got, 0);
  const totalPct  = totalNeed > 0 ? totalGot / totalNeed : 0;

  return (
    <div className="frame" style={{ padding: 24 }}>
      {/* big real-time counter */}
      <div style={{ textAlign: 'center', marginBottom: 24, padding: '16px 0', borderBottom: '2px dashed var(--line)' }}>
        <div style={{ fontFamily: 'Caveat', fontSize: 56, fontWeight: 700, lineHeight: 1 }}>
          <span style={{ color: 'var(--accent)' }}>{totalGot}</span>
          <span style={{ color: 'var(--mute)', fontSize: 32 }}> / {totalNeed} ชิ้น</span>
        </div>
        <div style={{ fontFamily: 'Patrick Hand', fontSize: 15, color: 'var(--mute)', marginTop: 4 }}>
          แพ็คกิ้งวันนี้ · {Math.round(totalPct * 100)}% เสร็จแล้ว · {boxes.filter(b => b.status === 'closed' || b.status === 'exported').length} ลังปิดแล้ว
        </div>
      </div>

      {/* summary row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 700 }}>📦 ภาพรวมรายคน</div>
      </div>

      {!hasCatalog ? (
        <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Patrick Hand', fontSize: 16, color: 'var(--mute)' }}>
          ยังไม่มีข้อมูล · กรุณานำเข้ารายการเบิกสินค้าและกด 🔀 สุ่มใหม่ก่อน
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {packerStats.map(p => (
            <div key={p.code} style={{
              border: '2px solid var(--line)',
              borderRadius: 14,
              padding: '20px 16px',
              background: 'white',
              boxShadow: '3px 3px 0 var(--line)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
              <div style={{ fontFamily: 'Caveat', fontSize: 22, fontWeight: 700, color: p.color }}>{p.name}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--mute)' }}>{p.code}</div>

              {/* doughnut + center text */}
              <div style={{ position: 'relative', width: 130, height: 130 }}>
                <Doughnut pct={p.pct} color={p.color} />
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontFamily: 'Caveat', fontSize: 30, fontWeight: 700, color: p.color, lineHeight: 1 }}>
                    {Math.round(p.pct * 100)}%
                  </div>
                  <div style={{ fontFamily: 'Patrick Hand', fontSize: 12, color: 'var(--mute)' }}>เสร็จแล้ว</div>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Caveat', fontSize: 20, fontWeight: 700 }}>
                  <span style={{ color: p.color }}>{p.got}</span>
                  <span style={{ color: 'var(--mute)', fontSize: 16 }}> / {p.need} ชิ้น</span>
                </div>
                <div style={{ fontFamily: 'Patrick Hand', fontSize: 13, color: 'var(--mute)', marginTop: 4 }}>
                  {p.skuCount} SKU · {p.closedBoxes} ลังปิดแล้ว
                </div>
              </div>

              {/* mini progress bar */}
              <div style={{ width: '100%', height: 6, background: '#e8e8e0', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: p.color,
                  width: `${Math.round(p.pct * 100)}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
