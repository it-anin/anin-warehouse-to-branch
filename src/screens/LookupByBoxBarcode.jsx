import { useState } from 'react';
import { sampleLine } from '../data.js';

const statusLabel = {
  open:     'เปิด',
  packing:  'กำลังแพ็ค',
  closed:   'ปิดลังแล้ว',
  exported: 'ส่ง POS แล้ว',
};

const statusCls = {
  open:     'chip',
  packing:  'chip warn',
  closed:   'chip ok',
  exported: 'chip',
};

export default function LookupByBoxBarcode({ boxes, setTab, setActiveBoxId, showToast }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);

  function doSearch(val) {
    const q = val.trim().toLowerCase();
    if (!q) { setResult(null); return; }
    const found = boxes.find(b =>
      b.id.toLowerCase().includes(q) || b.pos.toLowerCase().includes(q)
    );
    setResult(found || 'not_found');
  }

  function handleEdit() {
    if (!result || result === 'not_found') return;
    setActiveBoxId(result.id);
    setTab('scan');
    showToast('เปิดลังเพื่อแก้ไข');
  }

  const foundBox = result && result !== 'not_found' ? result : null;

  return (
    <div className="frame" style={{ padding: 0, position: 'relative', minHeight: 480 }}>
      <div className="frame-header">
        <div className="row">
          <span className="title">🔍 สแกนลังเพื่อดูรายการ</span>
        </div>
        <div className="row">
          <span className="scan-indicator">พร้อมรับการยิง</span>
        </div>
      </div>

      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="hand" style={{ fontSize: 22, marginBottom: 10 }}>ยิงบาร์โค้ดปิดลัง</div>
          <div style={{ border: '3px dashed var(--line)', borderRadius: 14, padding: 24, background: 'white' }}>
            <div style={{ fontFamily: 'Caveat', fontSize: 60, fontWeight: 700, color: 'var(--accent)' }}>|||</div>
            <input
              className="input big"
              placeholder="BX-…"
              style={{ textAlign: 'center' }}
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); doSearch(e.target.value); }}
              onKeyDown={(e) => { if (e.key === 'Enter') doSearch(query); }}
            />
          </div>
          <div style={{ fontFamily: 'Patrick Hand', color: 'var(--mute)', marginTop: 8, fontSize: 14 }}>
            หรือ พิมพ์ Box ID / POS number
          </div>
        </div>

        <div>
          {foundBox ? (
            <>
              <div className="row" style={{ marginBottom: 8 }}>
                <b style={{ fontFamily: 'Caveat', fontSize: 22 }}>{foundBox.id}</b>
                <span className={statusCls[foundBox.status] || 'chip'} style={{ marginLeft: 10 }}>
                  {statusLabel[foundBox.status] || foundBox.status}
                </span>
                <span className="mono" style={{ color: 'var(--mute)', marginLeft: 10, fontSize: 11 }}>POS: {foundBox.pos}</span>
              </div>
              <div style={{ border: '1.5px solid var(--line)', borderRadius: 10, background: 'white', overflow: 'hidden' }}>
                <table className="tbl" style={{ fontSize: 14 }}>
                  <thead><tr><th>SKU</th><th>ชื่อ</th><th>หน่วย</th><th style={{ width: 60 }}>จำนวน</th></tr></thead>
                  <tbody>
                    {sampleLine.slice(0, 8).map((l) => (
                      <tr key={l.sku}>
                        <td className="num-col">{l.sku}</td>
                        <td>{l.name}</td>
                        <td>{l.unit}</td>
                        <td>×{l.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row" style={{ marginTop: 10, gap: 8 }}>
                <button className="btn" onClick={() => window.print()}>พิมพ์ใบรายการ</button>
                <button className="btn" onClick={handleEdit}>เปิดลังใหม่ (แก้ไข)</button>
                <button className="btn ghost" onClick={() => showToast('ส่งข้อมูลให้คนขับแล้ว ✓')}>ส่งต่อให้คนขับ</button>
              </div>
            </>
          ) : result === 'not_found' ? (
            <div style={{ fontFamily: 'Patrick Hand', color: 'var(--red)', padding: 20, fontSize: 18 }}>
              ไม่พบลัง "{query}"
            </div>
          ) : (
            <>
              <div className="row" style={{ marginBottom: 8 }}>
                <b style={{ fontFamily: 'Caveat', fontSize: 22 }}>BX-2604-0013</b>
                <span className="chip ok" style={{ marginLeft: 10 }}>ปิดลังแล้ว</span>
                <span className="mono" style={{ color: 'var(--mute)', marginLeft: 10, fontSize: 11 }}>packed 10:42 โดย ต้น</span>
              </div>
              <div style={{ border: '1.5px solid var(--line)', borderRadius: 10, background: 'white', overflow: 'hidden' }}>
                <table className="tbl" style={{ fontSize: 14 }}>
                  <thead><tr><th>SKU</th><th>ชื่อ</th><th>หน่วย</th><th style={{ width: 60 }}>จำนวน</th></tr></thead>
                  <tbody>
                    {sampleLine.slice(0, 8).map((l) => (
                      <tr key={l.sku}>
                        <td className="num-col">{l.sku}</td>
                        <td>{l.name}</td>
                        <td>{l.unit}</td>
                        <td>×{l.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row" style={{ marginTop: 10, gap: 8 }}>
                <button className="btn" onClick={() => window.print()}>พิมพ์ใบรายการ</button>
                <button className="btn" onClick={() => showToast('ค้นหาลังก่อนแก้ไข')}>เปิดลังใหม่ (แก้ไข)</button>
                <button className="btn ghost" onClick={() => showToast('ส่งข้อมูลให้คนขับแล้ว ✓')}>ส่งต่อให้คนขับ</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
