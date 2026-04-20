import { useState } from 'react';
import Annotation from '../components/Annotation.jsx';
import { generatePOS } from '../data.js';

export default function PackScanC({ boxes, setBoxes, activeBoxId, setTab, showToast, createNewBox, setItemsByBox, catalog, packer }) {
  const [items, setItems] = useState(() =>
    catalog.map(c => ({ sku: c.sku, barcode: c.barcode, name: c.name, unit: c.unit, need: c.qty, got: 0 }))
  );

  const boxLabel = activeBoxId || 'BX-????';

  function handleBarcode(e) {
    if (e.key !== 'Enter') return;
    const val = e.target.value.trim();
    if (!val) return;
    e.target.value = '';

    const match = items.find(it => it.barcode === val || it.sku === val);
    if (!match) { showToast('ไม่พบในรายการเบิก'); return; }
    if (match.got >= match.need) { showToast('ครบแล้ว'); return; }

    setItems(prev => prev.map(it =>
      it.sku === match.sku ? { ...it, got: it.got + 1 } : it
    ));
  }

  function handleCloseBox() {
    const allDone = items.every(it => it.got >= it.need);
    const doClose = () => {
      const pos = generatePOS(activeBoxId || 'BX-0000-0000');
      const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const packedItems = items.map(it => ({ ...it, qty: it.got }));
      setBoxes(prev => prev.map(b =>
        b.id === activeBoxId
          ? { ...b, status: 'closed', packer: packer || b.packer || null, skuCount: items.length, totalQty: items.reduce((s, it) => s + it.got, 0), pos, updated: time }
          : b
      ));
      setItemsByBox(prev => ({ ...prev, [activeBoxId]: packedItems }));
      setTab('closed');
    };

    if (allDone) {
      doClose();
    } else {
      if (window.confirm('ยังขาดสินค้า ปิดเลยไหม?')) doClose();
    }
  }

  const missing = items.filter(it => it.got < it.need);
  const doneCount = items.filter(it => it.got >= it.need).length;

  return (
    <div className="frame" style={{ padding: 0, position: 'relative', minHeight: 580 }}>
      <div className="frame-header">
        <div className="row">
          <button className="btn sm ghost" onClick={() => setTab('list')}>←</button>
          <span className="title">Packing List · {boxLabel}</span>
          <span className="chip warn" style={{ marginLeft: 10 }}>แผน: order #ORD-7729</span>
          {packer && (
            <span className="mono" style={{ fontSize: 12, color: 'var(--mute)', marginLeft: 8 }}>
              {packer.code} · {packer.name}
            </span>
          )}
          <div className="spacer" />
          <button className="btn primary" onClick={() => { createNewBox(); showToast('เปิดลังใหม่แล้ว'); }}>+ เปิดลังใหม่</button>
        </div>
        <div className="row">
          <span className="mono" style={{ fontSize: 13 }}>เช็ค {doneCount} / {items.length} รายการ</span>
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <div className="row" style={{ marginBottom: 12, gap: 12 }}>
          <input
            className="input big"
            placeholder="ยิงบาร์โค้ด → ติ๊กอัตโนมัติ"
            style={{ flex: 1 }}
            autoFocus
            onKeyDown={handleBarcode}
          />
          <button className="btn primary lg" onClick={handleCloseBox}>ปิดลัง</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {items.map((c) => {
            const done = c.got >= c.need;
            const partial = c.got > 0 && c.got < c.need;
            return (
              <div key={c.sku} style={{
                display: 'flex', gap: 12, padding: 12,
                border: `2px solid ${done ? 'var(--green)' : partial ? 'var(--accent)' : 'var(--line)'}`,
                borderRadius: 10,
                background: done ? '#e8f0d8' : partial ? '#fae5b0' : 'white',
                alignItems: 'center',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '2px solid var(--line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? 'var(--green)' : 'white',
                  color: 'white', fontSize: 20, fontWeight: 700,
                }}>
                  {done ? '✓' : ''}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>{c.sku}</div>
                  <div style={{ fontFamily: 'Patrick Hand', fontSize: 16 }}>{c.name}</div>
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'Caveat', fontWeight: 700, fontSize: 22 }}>
                  <span style={{ color: done ? 'var(--green)' : partial ? 'var(--accent)' : 'var(--mute)' }}>{c.got}</span>
                  <span style={{ fontSize: 16, color: 'var(--mute)' }}> / {c.need}</span>
                  <div style={{ fontSize: 12, fontFamily: 'Patrick Hand', color: 'var(--mute)' }}>{c.unit}</div>
                </div>
              </div>
            );
          })}
        </div>

        {missing.length > 0 && (
          <div style={{ marginTop: 16, padding: 12, background: 'var(--paper-dark)', borderRadius: 10, fontFamily: 'Patrick Hand' }}>
            <b>⚠ ยังขาด:</b> {missing.map(it => `${it.name} (${it.need - it.got})`).join(', ')}
          </div>
        )}
      </div>
      <Annotation text="เขียวแปลว่าครบ · เหลือง = ยังขาด" style={{ top: 140, right: 40 }} arrow="br" />
    </div>
  );
}
