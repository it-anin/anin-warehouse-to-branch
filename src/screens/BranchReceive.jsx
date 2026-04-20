import { useState, useRef, useEffect } from 'react';

const statusLabel = {
  open:     'เปิด',
  packing:  'กำลังแพ็ค',
  closed:   'ปิดลังแล้ว',
  exported: 'ส่ง POS แล้ว',
  received: 'รับสินค้าแล้ว',
};

function BoxCard({ box, isActive }) {
  const isReceived = box.status === 'received';
  if (isReceived) {
    return (
      <div style={{
        padding: '14px 16px',
        border: '2.5px solid var(--green)', borderRadius: 14,
        background: '#edf5e0', boxShadow: '3px 3px 0 #c6dea6',
      }}>
        <div style={{ fontFamily: 'Patrick Hand', fontSize: 11, color: '#6a9a3a', marginBottom: 2 }}>
          {isActive ? 'ลังที่กำลังตรวจ' : 'รับแล้ว ✓'}
        </div>
        <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{box.id}</div>
        <div style={{ fontFamily: 'Patrick Hand', fontSize: 12, color: 'var(--mute)', marginTop: 3 }}>POS: {box.pos}</div>
        {box.packer && (
          <div style={{ fontFamily: 'Patrick Hand', fontSize: 12, color: '#6a9a3a', marginTop: 2 }}>
            แพ็คโดย: {box.packer.name}
          </div>
        )}
        <div className="row" style={{ marginTop: 10, gap: 6 }}>
          <span className="chip ok">{box.skuCount ?? 0} SKU</span>
          <span className="chip ok">{box.totalQty ?? 0} ชิ้น</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      padding: '14px 16px',
      border: `2px solid ${isActive ? 'var(--accent)' : 'var(--line)'}`,
      borderRadius: 14,
      background: isActive ? 'var(--paper-dark)' : 'white',
      opacity: isActive ? 1 : 0.7,
    }}>
      <div style={{ fontFamily: 'Patrick Hand', fontSize: 11, color: 'var(--mute)', marginBottom: 2 }}>
        {isActive ? 'ลังที่กำลังตรวจ' : statusLabel[box.status] || box.status}
      </div>
      <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{box.id}</div>
      <div style={{ fontFamily: 'Patrick Hand', fontSize: 12, color: 'var(--mute)', marginTop: 3 }}>POS: {box.pos}</div>
      {box.packer && (
        <div style={{ fontFamily: 'Patrick Hand', fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>
          แพ็คโดย: {box.packer.name}
        </div>
      )}
      <div className="row" style={{ marginTop: 10, gap: 6 }}>
        <span className="chip">{box.skuCount ?? 0} SKU</span>
        <span className="chip">{box.totalQty ?? 0} ชิ้น</span>
      </div>
    </div>
  );
}

export default function BranchReceive({ boxes, setBoxes, itemsByBox, showToast, receiveBoxIds, setReceiveBoxIds }) {
  const [phase, setPhase]             = useState(() => receiveBoxIds.length > 0 ? 'verify' : 'scan');
  const [query, setQuery]             = useState('');
  const [notFound, setNotFound]       = useState(false);
  const [checkedSkus, setCheckedSkus] = useState(new Set());
  const [itemScan, setItemScan]       = useState('');
  const [lastScannedSku, setLastScannedSku] = useState(null);
  const [scanError, setScanError]     = useState('');
  const inputRef    = useRef(null);
  const itemScanRef = useRef(null);

  const activeBoxId = receiveBoxIds.length > 0 ? receiveBoxIds[receiveBoxIds.length - 1] : null;
  const foundBox    = activeBoxId ? boxes.find(b => b.id === activeBoxId) || null : null;
  const isReceived  = foundBox?.status === 'received';

  const scannedBoxes = receiveBoxIds
    .map(id => boxes.find(b => b.id === id))
    .filter(Boolean)
    .reverse();

  useEffect(() => {
    if (phase === 'scan') setTimeout(() => inputRef.current?.focus(), 50);
    if (phase === 'verify') setTimeout(() => itemScanRef.current?.focus(), 50);
  }, [phase]);

  function handleScan(e) {
    if (e.key !== 'Enter') return;
    const q = query.trim().toLowerCase();
    if (!q) return;

    const box = boxes.find(b =>
      b.id.toLowerCase().includes(q) ||
      b.pos.replace(/\s/g, '').toLowerCase().includes(q.replace(/\s/g, ''))
    );

    if (box) {
      setReceiveBoxIds(prev => prev.includes(box.id) ? prev : [...prev, box.id]);
      setNotFound(false);
      setCheckedSkus(new Set());
      setItemScan('');
      setLastScannedSku(null);
      setScanError('');
      setQuery('');
      setPhase('verify');
    } else {
      setNotFound(true);
    }
  }

  function handleSkip() {
    showToast('ข้ามลังแล้ว · สแกนลังใหม่');
    setCheckedSkus(new Set());
    setQuery('');
    setNotFound(false);
    setPhase('scan');
  }

  function handleConfirm() {
    if (!foundBox) return;
    setBoxes(prev => prev.map(b =>
      b.id === foundBox.id
        ? { ...b, status: 'received', updated: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) }
        : b
    ));
    showToast('ยืนยันรับสินค้าแล้ว ✓');
  }

  function handleScanNext() {
    setCheckedSkus(new Set());
    setQuery('');
    setNotFound(false);
    setPhase('scan');
  }

  function handleItemScan(e) {
    if (e.key !== 'Enter') return;
    const val = itemScan.trim();
    if (!val) return;
    setItemScan('');

    const match = boxItems.find(l => l.barcode === val || l.sku === val);
    if (!match) {
      setScanError(`ไม่พบ "${val}" ในลังนี้`);
      setLastScannedSku(null);
      return;
    }
    setScanError('');
    setLastScannedSku(match.sku);
    setCheckedSkus(prev => new Set([...prev, match.sku]));
  }

  function toggleCheck(sku) {
    setCheckedSkus(prev => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku); else next.add(sku);
      return next;
    });
  }

  const boxItems   = foundBox ? (itemsByBox[foundBox.id] || []) : [];
  const allChecked = boxItems.length > 0 && checkedSkus.size === boxItems.length;

  return (
    <div className="frame" style={{ padding: 0, position: 'relative', minHeight: 560 }}>
      {/* ── header ── */}
      <div className="frame-header">
        <div className="row">
          <span className="title">📥 รับสินค้าเข้าสาขา</span>
          {foundBox && (
            <span className="chip" style={{ marginLeft: 10 }}>
              {isReceived ? '✓ รับแล้ว' : `● ${statusLabel[foundBox.status] || ''}`}
            </span>
          )}
          <span className="mono" style={{ color: 'var(--mute)', marginLeft: 12 }}>
            {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} · สาขา
          </span>
          <div className="spacer" />
          {phase === 'verify' && !isReceived && (
            <button className="btn ghost" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={handleSkip}>
              ↩ ข้ามลัง · สแกนลังใหม่
            </button>
          )}
          {(isReceived || phase === 'verify') && (
            <button className="btn primary" style={{ marginLeft: 8 }} onClick={handleScanNext}>+ สแกนลังถัดไป</button>
          )}
        </div>
        <div className="row">
          <span className="scan-indicator">
            {phase === 'scan' ? 'รอสแกนบาร์โค้ดลัง' : isReceived ? 'รับสินค้าแล้ว' : 'ตรวจสอบสินค้าในลัง'}
          </span>
          {receiveBoxIds.length > 0 && (
            <span className="chip" style={{ marginLeft: 8 }}>{receiveBoxIds.length} ลัง</span>
          )}
        </div>
      </div>

      {/* ── body: 2-col ── */}
      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>

        {/* LEFT: stacked box cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 520 }}>
          {scannedBoxes.length === 0 ? (
            <div style={{
              padding: '18px 16px',
              border: '2px dashed var(--line)', borderRadius: 14,
              background: 'var(--paper-dark)', textAlign: 'center',
              color: 'var(--mute)', fontFamily: 'Patrick Hand', fontSize: 14,
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
              <div>ยังไม่ได้สแกนลัง</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>สแกนบาร์โค้ดลังเพื่อเริ่มต้น</div>
            </div>
          ) : (
            scannedBoxes.map((box, i) => (
              <BoxCard key={box.id} box={box} isActive={i === 0} />
            ))
          )}

          {/* progress bar for active box */}
          {phase === 'verify' && !isReceived && boxItems.length > 0 && (
            <div style={{ padding: 14, border: '1.5px solid var(--line)', borderRadius: 10, background: 'white' }}>
              <div style={{ fontFamily: 'Patrick Hand', fontSize: 14, marginBottom: 8 }}>ความคืบหน้า</div>
              <div style={{ height: 10, background: 'var(--paper-dark)', borderRadius: 5, overflow: 'hidden', border: '1.5px solid var(--line)' }}>
                <div style={{
                  width: `${(checkedSkus.size / boxItems.length) * 100}%`,
                  height: '100%', background: 'var(--green)', transition: 'width 0.2s',
                }} />
              </div>
              <div style={{ fontFamily: 'Patrick Hand', fontSize: 13, color: 'var(--mute)', marginTop: 6 }}>
                {checkedSkus.size} / {boxItems.length} รายการ
              </div>
            </div>
          )}

          {phase === 'verify' && !isReceived && (
            <div style={{
              padding: 12, border: '1.5px dashed var(--line)', borderRadius: 10,
              fontFamily: 'Patrick Hand', fontSize: 13, color: 'var(--mute)', background: 'var(--paper-dark)',
            }}>
              <b>ถ้าสินค้าขาดหรือไม่ครบ</b><br />
              กดปุ่ม "↩ ข้ามลัง" เพื่อแจ้งปัญหาและสแกนลังถัดไป
            </div>
          )}
        </div>

        {/* RIGHT: scan zone OR checklist */}
        <div>
          {phase === 'scan' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 20 }}>
              <div style={{ fontFamily: 'Caveat', fontSize: 26, fontWeight: 700 }}>สแกนบาร์โค้ดลัง</div>
              <div style={{
                width: '100%',
                border: '3px dashed var(--line)', borderRadius: 20,
                padding: '32px 28px', textAlign: 'center', background: 'white',
              }}>
                <div style={{ fontFamily: 'Caveat', fontSize: 72, fontWeight: 700, color: 'var(--accent)', letterSpacing: 6, lineHeight: 1 }}>|||</div>
                <div className="hand" style={{ fontSize: 18, color: 'var(--mute)', margin: '10px 0' }}>ยิงบาร์โค้ดที่ติดลัง</div>
                <input
                  ref={inputRef}
                  className="input big"
                  placeholder="BX-… หรือ POS number"
                  style={{ textAlign: 'center', fontSize: 20, width: '100%' }}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setNotFound(false); }}
                  onKeyDown={handleScan}
                />
                <div style={{ fontFamily: 'Patrick Hand', color: 'var(--mute)', marginTop: 10, fontSize: 14 }}>
                  กด Enter หรือยิงบาร์โค้ดเพื่อค้นหาลัง
                </div>
              </div>
              {notFound && (
                <div style={{
                  padding: '12px 20px', width: '100%',
                  border: '2px solid var(--red)', borderRadius: 12,
                  background: '#fde8e8', fontFamily: 'Patrick Hand', fontSize: 15, color: 'var(--red)',
                }}>
                  ⚠ ไม่พบลัง "{query}" — ลองสแกนใหม่อีกครั้ง
                </div>
              )}
            </div>
          ) : (
            <>
              {boxItems.length === 0 ? (
                <div style={{
                  padding: 30, border: '2px dashed var(--line)', borderRadius: 12,
                  background: 'var(--paper-dark)', fontFamily: 'Patrick Hand',
                  fontSize: 16, color: 'var(--mute)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
                  <div>ลังนี้ยังไม่มีข้อมูลรายการสินค้า</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>อาจยังไม่ผ่านการสแกนจากฝ่ายแพ็คกิ้ง</div>
                  <button className="btn ghost" style={{ marginTop: 14 }} onClick={handleSkip}>↩ ข้ามลัง · สแกนลังใหม่</button>
                </div>
              ) : (
                <>
                  <div className="row" style={{ marginBottom: 10 }}>
                    <div>
                      <b style={{ fontFamily: 'Caveat', fontSize: 22 }}>ตรวจสอบสินค้าในลัง</b>
                      {foundBox?.packer && (
                        <span style={{ fontFamily: 'Patrick Hand', fontSize: 13, color: 'var(--mute)', marginLeft: 10 }}>
                          แพ็คโดย: <b style={{ color: '#555' }}>{foundBox.packer.name} · {foundBox.packer.code}</b>
                        </span>
                      )}
                    </div>
                    <div className="spacer" />
                    {!isReceived && (
                      <button
                        className="btn sm ghost"
                        onClick={() => {
                          if (allChecked) setCheckedSkus(new Set());
                          else setCheckedSkus(new Set(boxItems.map(l => l.sku)));
                        }}
                      >
                        {allChecked ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                      </button>
                    )}
                  </div>

                  {!isReceived && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="row" style={{ gap: 10 }}>
                        <input
                          ref={itemScanRef}
                          className="input big"
                          placeholder="ยิงบาร์โค้ดสินค้า → ติ๊กอัตโนมัติ"
                          value={itemScan}
                          onChange={(e) => { setItemScan(e.target.value); setScanError(''); }}
                          onKeyDown={handleItemScan}
                          style={{ flex: 1 }}
                        />
                        <span className="scan-indicator" style={{ whiteSpace: 'nowrap' }}>พร้อมรับการยิง</span>
                      </div>
                      {scanError && (
                        <div style={{ fontFamily: 'Patrick Hand', fontSize: 13, color: 'var(--red)', marginTop: 4 }}>⚠ {scanError}</div>
                      )}
                      {lastScannedSku && !scanError && (
                        <div style={{ fontFamily: 'Patrick Hand', fontSize: 13, color: 'var(--green)', marginTop: 4 }}>
                          ✓ {boxItems.find(l => l.sku === lastScannedSku)?.name} — ติ๊กแล้ว
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ border: '1.5px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'white', maxHeight: 300, overflowY: 'auto' }}>
                    <table className="tbl" style={{ fontSize: 14 }}>
                      <thead style={{ position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ width: 36 }}>✓</th>
                          <th>SKU / ชื่อ</th>
                          <th style={{ width: 70 }}>หน่วย</th>
                          <th style={{ width: 60 }}>จำนวน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boxItems.map((l) => {
                          const checked = checkedSkus.has(l.sku);
                          const justScanned = l.sku === lastScannedSku;
                          return (
                            <tr
                              key={l.sku}
                              style={{
                                cursor: isReceived ? 'default' : 'pointer',
                                background: justScanned ? 'var(--accent-soft)' : checked ? '#e8f0d8' : 'white',
                                transition: 'background 0.12s',
                              }}
                              onClick={() => !isReceived && toggleCheck(l.sku)}
                            >
                              <td style={{ textAlign: 'center' }}>
                                <div style={{
                                  width: 22, height: 22, borderRadius: '50%', margin: '0 auto',
                                  border: `2px solid ${checked ? 'var(--green)' : 'var(--line)'}`,
                                  background: checked ? 'var(--green)' : 'white',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'white', fontSize: 13, fontWeight: 700,
                                  transition: 'background 0.12s',
                                }}>
                                  {checked ? '✓' : ''}
                                </div>
                              </td>
                              <td>
                                <div className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>{l.sku}</div>
                                <div style={{ fontFamily: 'Patrick Hand', fontSize: 15 }}>{l.name}</div>
                              </td>
                              <td style={{ fontFamily: 'Patrick Hand' }}>{l.unit}</td>
                              <td style={{ fontFamily: 'Caveat', fontSize: 20, fontWeight: 700, textAlign: 'center' }}>
                                ×{l.qty ?? l.got ?? 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {isReceived ? (
                    <div style={{
                      marginTop: 14, padding: '12px 18px',
                      border: '2px solid var(--green)', borderRadius: 10,
                      background: '#e8f0d8', textAlign: 'center',
                      fontFamily: 'Caveat', fontSize: 22, fontWeight: 700, color: 'var(--green)',
                    }}>
                      ✓ รับสินค้าเรียบร้อยแล้ว — {foundBox?.id}
                    </div>
                  ) : (
                    <div className="row" style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: 'Patrick Hand', fontSize: 14, color: 'var(--mute)', flex: 1 }}>
                        {checkedSkus.size === 0
                          ? 'คลิกแต่ละแถวเพื่อติ๊กยืนยันสินค้า'
                          : checkedSkus.size < boxItems.length
                            ? `ยังไม่ได้ตรวจ ${boxItems.length - checkedSkus.size} รายการ`
                            : 'ตรวจครบทุกรายการแล้ว 🎉'}
                      </div>
                      <button className="btn" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={handleSkip}>↩ ข้ามลัง</button>
                      <button className="btn primary lg" onClick={handleConfirm}>✓ ยืนยันรับสินค้า</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
