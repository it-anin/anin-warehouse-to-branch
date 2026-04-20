import SketchyBarcode from '../components/SketchyBarcode.jsx';
import Annotation from '../components/Annotation.jsx';
import { sampleLine } from '../data.js';

export default function BoxClosedLabel({ boxes, setBoxes, activeBoxId, setTab, showToast, createNewBox }) {
  const activeBox = boxes.find(b => b.id === activeBoxId) || boxes.find(b => b.status === 'closed') || boxes[0];
  const posNumber = activeBox?.pos && activeBox.pos !== '—' ? activeBox.pos : '8813 2604 0013 4';
  const boxId = activeBox?.id || 'BX-2604-0013';

  function handleCopy() {
    navigator.clipboard.writeText(posNumber).then(() => showToast('คัดลอกแล้ว'));
  }

  function handleSendPOS() {
    if (!activeBox) return;
    setBoxes(prev => prev.map(b =>
      b.id === activeBox.id ? { ...b, status: 'exported' } : b
    ));
    showToast('ส่ง POS แล้ว ✓');
    setTab('list');
  }

  function handleNextBox() {
    createNewBox();
    setTab('scan');
  }

  return (
    <div className="frame" style={{ padding: 0, position: 'relative', minHeight: 480 }}>
      <div className="frame-header">
        <div className="row">
          <span className="title">🎉 ปิดลังสำเร็จ</span>
          <span className="chip ok" style={{ marginLeft: 10 }}>✓ {boxId}</span>
        </div>
        <button className="btn sm ghost" onClick={() => setTab('list')}>× ปิดหน้าต่าง</button>
      </div>

      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        <div>
          <div className="hand" style={{ fontSize: 20, marginBottom: 8 }}>ตัวอย่างสติกเกอร์ติดลัง (10×10 cm)</div>
          <div style={{ background: 'white', border: '2px solid var(--line)', borderRadius: 8, padding: 18, fontFamily: 'JetBrains Mono' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed var(--line)', paddingBottom: 8 }}>
              <div>
                <div style={{ fontFamily: 'Caveat', fontSize: 24, fontWeight: 700 }}>คลังกลาง · WH-01</div>
                <div style={{ fontSize: 11, color: 'var(--mute)' }}>packed {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <div style={{ fontSize: 14 }}>{boxId}</div>
            </div>
            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <SketchyBarcode value={posNumber.replace(/\s/g, '')} width={320} height={64} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>SKU: <b>{activeBox?.skuCount ?? 11}</b></div>
              <div>ชิ้น: <b>{activeBox?.totalQty ?? 18}</b></div>
              <div>POS: <b>{posNumber}</b></div>
              <div>น้ำหนัก: ~4.8 kg</div>
            </div>
          </div>

          <div className="row" style={{ marginTop: 14, gap: 10 }}>
            <button className="btn primary" onClick={() => window.print()}>🖨 พิมพ์สติกเกอร์</button>
            <button className="btn" onClick={() => window.print()}>⇩ PDF</button>
            <button className="btn ghost" onClick={() => showToast('ส่ง LINE OA แล้ว ✓')}>ส่งเข้า LINE OA</button>
          </div>
        </div>

        <div>
          <div className="hand" style={{ fontSize: 20, marginBottom: 8 }}>หมายเลขสำหรับ POS</div>
          <div style={{ padding: 18, background: 'var(--yellow)', border: '2px solid var(--line)', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: 700, letterSpacing: 4 }}>
              {posNumber}
            </div>
            <div style={{ fontFamily: 'Patrick Hand', fontSize: 14, marginTop: 4, color: 'var(--mute)' }}>
              (รูปแบบสุดท้ายยังไม่กำหนด — placeholder)
            </div>
            <button className="btn sm" style={{ marginTop: 10 }} onClick={handleCopy}>📋 คัดลอก</button>
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="hand" style={{ fontSize: 20, marginBottom: 6 }}>รายชื่อสินค้าในลัง</div>
            <div style={{ border: '1.5px solid var(--line)', borderRadius: 8, padding: 10, maxHeight: 170, overflow: 'auto', background: 'white' }}>
              {sampleLine.slice(0, 8).map((l) => (
                <div key={l.sku} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Patrick Hand', fontSize: 14, padding: '3px 0', borderBottom: '1px dashed #ddd' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{l.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--mute)', marginLeft: 8 }}>×{l.qty} {l.unit}</span>
                </div>
              ))}
              <div style={{ fontFamily: 'Patrick Hand', fontSize: 13, color: 'var(--mute)', marginTop: 4 }}>… อีก {Math.max(0, sampleLine.length - 8)} รายการ</div>
            </div>
          </div>

          <div className="row" style={{ marginTop: 14, gap: 8 }}>
            <button className="btn" onClick={handleNextBox}>+ เปิดลังต่อไป</button>
            <button className="btn primary" onClick={handleSendPOS}>ส่งเข้า POS ตอนนี้</button>
          </div>
        </div>
      </div>
      <Annotation text="ยิงบาร์โค้ดนี้ที่หน้าคลัง → เห็นสินค้าในลัง" style={{ top: 200, left: 170, maxWidth: 180 }} arrow="bl" />
    </div>
  );
}
