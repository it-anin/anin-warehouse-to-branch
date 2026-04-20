import { useState, useEffect, useCallback, useRef } from 'react';

import BoxList from './screens/BoxList.jsx';
import PackScanA from './screens/PackScanA.jsx';
import PackScanB from './screens/PackScanB.jsx';
import PackScanC from './screens/PackScanC.jsx';
import BoxClosedLabel from './screens/BoxClosedLabel.jsx';
import ExportPOS from './screens/ExportPOS.jsx';
import LookupByBoxBarcode from './screens/LookupByBoxBarcode.jsx';
import BranchReceive from './screens/BranchReceive.jsx';
import FlowDiagram from './screens/FlowDiagram.jsx';
import TweaksPanel from './components/TweaksPanel.jsx';
import Toast from './components/Toast.jsx';
import { boxes as initialBoxes, sampleLine } from './data.js';
import ImportCatalog from './components/ImportCatalog.jsx';

const TABS = [
  { k: 'all',    label: 'Dashboard' },
  { k: 'flow',   label: 'Flow' },
  { k: 'list',   label: 'รายการเบิกสินค้า' },
  { k: 'scan',   label: 'แพ็คกิ้ง' },
  { k: 'closed', label: 'Closed Box + Label' },
  { k: 'lookup', label: 'Lookup by Box Barcode' },
  { k: 'export', label: 'Export POS' },
  { k: 'receive', label: '📥 รับสินค้า (สาขา)' },
];

const DEFAULT_TWEAKS = {
  density: 'comfy',
  variant: 'A',
  accent: 'orange',
  barcode: '1D',
  annotations: 'on',
};

const ACCENTS = { orange: '#e8692b', blue: '#2b6ce8', green: '#5c8a3a', pink: '#d94a8a' };
const ACCENT_SOFT = { orange: '#f5c9a8', blue: '#b8cef5', green: '#c4d8a8', pink: '#f5c2db' };

export default function App() {
  const [tab, setTab] = useState(() => localStorage.getItem('wh_tab') || 'all');
  const [tweaks, setTweaks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wh_tweaks')) || {}; }
    catch { return {}; }
  });
  const [open, setOpen] = useState(false);

  const [boxes, setBoxes] = useState(initialBoxes);
  const [activeBoxId, setActiveBoxId] = useState(null);
  const [packer, setPacker] = useState(null);
  const [catalog, setCatalog] = useState(sampleLine);
  const [itemsByBox, setItemsByBox] = useState({});
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wh_history')) || []; }
    catch { return []; }
  });
  const [toasts, setToasts] = useState([]);
  const toastTimers = useRef([]);
  const [receiveBoxIds, setReceiveBoxIds] = useState([]);

  const merged = { ...DEFAULT_TWEAKS, ...tweaks };

  useEffect(() => { localStorage.setItem('wh_tab', tab); }, [tab]);
  useEffect(() => { localStorage.setItem('wh_tweaks', JSON.stringify(merged)); }, [tweaks]);
  useEffect(() => { localStorage.setItem('wh_history', JSON.stringify(history)); }, [history]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', ACCENTS[merged.accent]);
    document.documentElement.style.setProperty('--accent-soft', ACCENT_SOFT[merged.accent]);
    document.documentElement.style.setProperty('--note-display', merged.annotations === 'on' ? 'block' : 'none');
  }, [merged.accent, merged.annotations]);

  useEffect(() => {
    return () => toastTimers.current.forEach(clearTimeout);
  }, []);

  const showToast = useCallback((message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2000);
    toastTimers.current.push(timer);
  }, []);

  function generateBoxId(currentBoxes) {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayPrefix = `BX-${mm}${dd}-`;
    const serials = currentBoxes
      .filter(b => b.id.startsWith(todayPrefix))
      .map(b => parseInt(b.id.slice(-4), 10))
      .filter(n => !isNaN(n));
    const next = serials.length > 0 ? Math.max(...serials) + 1 : 1;
    return `${todayPrefix}${String(next).padStart(4, '0')}`;
  }

  function createNewBox() {
    const now = new Date();
    const time = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    let newBox;
    setBoxes(prev => {
      const newId = generateBoxId(prev);
      newBox = { id: newId, pos: '—', status: 'open', packer: packer || null, skuCount: 0, totalQty: 0, updated: time };
      return [newBox, ...prev];
    });
    // use a ref trick — read id after state settles via effect or just derive it
    const now2 = new Date();
    const mm = String(now2.getMonth() + 1).padStart(2, '0');
    const dd = String(now2.getDate()).padStart(2, '0');
    const todayPrefix = `BX-${mm}${dd}-`;
    const serials = boxes
      .filter(b => b.id.startsWith(todayPrefix))
      .map(b => parseInt(b.id.slice(-4), 10))
      .filter(n => !isNaN(n));
    const next = serials.length > 0 ? Math.max(...serials) + 1 : 1;
    const newId = `${todayPrefix}${String(next).padStart(4, '0')}`;
    setActiveBoxId(newId);
    return newId;
  }

  function clearBoxes() {
    if (boxes.length === 0) { showToast('ไม่มีข้อมูลลังในวันนี้'); return; }
    if (!window.confirm(`ล้างข้อมูลลังทั้งหมด ${boxes.length} ลัง?\nข้อมูลจะถูกเก็บในประวัติย้อนหลัง 1 เดือน`)) return;
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    const label = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const entry = { dateKey, label, clearedAt: now.toISOString(), boxes: [...boxes] };
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);
    setHistory(prev => [entry, ...prev.filter(h => new Date(h.clearedAt) > cutoff)]);
    setBoxes([]);
    setItemsByBox({});
    showToast('ล้างข้อมูลแล้ว · เก็บประวัติไว้ 1 เดือน');
  }

  function generateCSV(targetBoxes) {
    const header = 'box_id,pos_number,sku_count,total_qty,status,updated';
    const rows = targetBoxes.map(b =>
      [b.id, b.pos, b.skuCount, b.totalQty, b.status, b.updated].join(',')
    );
    return [header, ...rows].join('\n');
  }

  function triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const showAll = tab === 'all';

  const PACKERS = [
    { code: 'EMP-01', name: 'มุก' },
    { code: 'EMP-02', name: 'เก้า' },
    { code: 'EMP-03', name: 'เต้' },
    { code: 'EMP-04', name: 'ตั๋ง' },
  ];

  const screenProps = { boxes, setBoxes, activeBoxId, setActiveBoxId, catalog, itemsByBox, setItemsByBox, history, clearBoxes, packer, setTab, showToast, createNewBox, generateCSV, triggerDownload, receiveBoxIds, setReceiveBoxIds };

  return (
    <>
      <div className="topbar">
        <h1>📦 Warehouse Scan &amp; Pack</h1>
        <span className="subtitle">anin-stock · v0.1</span>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.k} className={`tab ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="canvas">
        {(showAll || tab === 'flow') && (
          <>
            <div className="screen-label">
              <span className="num">00</span> Flow สรุปการใช้งาน
              <span className="desc">— ภาพรวมขั้นตอนตั้งแต่เปิดลัง ถึงส่งเข้า POS</span>
            </div>
            <FlowDiagram />
          </>
        )}

        {showAll && <div className="section-divider">screens</div>}

        {(showAll || tab === 'list') && (
          <>
            <div className="screen-label">
              <span className="num">01</span> Box List
              <span className="desc">— หน้าแรก: เห็นภาพรวมลังทั้งหมดของวัน</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <ImportCatalog catalog={catalog} onImport={(items) => { setCatalog(items); showToast(`นำเข้าแล้ว ${items.length} รายการ ✓`); }} />
            </div>
            <BoxList {...screenProps} />
          </>
        )}

        {(showAll || tab === 'scan') && (
          <>
            <div className="screen-label" style={{ marginTop: 40 }}>
              <span className="num">02</span>พนักงานแพ็คกิ้ง
              <span className="scribble">3 variants</span>
              <span className="desc">— หน้าหลักที่คนคลังใช้เยอะที่สุด</span>
            </div>

            {/* packer selector — above all variants */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 16, flexWrap: 'wrap',
            }}>
              <span style={{ fontFamily: 'Patrick Hand', fontSize: 15, color: 'var(--mute)' }}>
                พนักงานแพ็คกิ้ง:
              </span>
              {PACKERS.map(p => {
                const active = packer?.code === p.code;
                return (
                  <button
                    key={p.code}
                    onClick={() => setPacker(active ? null : p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px',
                      border: `2px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                      borderRadius: 999,
                      background: active ? 'var(--accent)' : 'white',
                      color: active ? 'white' : 'var(--ink)',
                      fontFamily: 'Patrick Hand', fontSize: 15,
                      cursor: 'pointer',
                      boxShadow: active ? '2px 2px 0 var(--line)' : '1px 1px 0 var(--line)',
                      transition: 'all 0.12s',
                    }}
                  >
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, opacity: 0.75 }}>{p.code}</span>
                    <span style={{ fontWeight: active ? 700 : 400 }}>{p.name}</span>
                  </button>
                );
              })}
              {packer && (
                <span style={{ fontFamily: 'Patrick Hand', fontSize: 14, color: 'var(--mute)' }}>
                  · กำลังแพ็คโดย <b>{packer.name}</b>
                </span>
              )}
            </div>

            {(showAll || merged.variant === 'A') && (
              <>
                <div className="variant-label">รายการเบิกสินค้า</div>
                <div style={{ fontFamily: 'Patrick Hand', color: 'var(--mute)', marginBottom: 8 }}>
                  ตารางเต็ม ด้าน summary · เหมาะกับจอใหญ่ / desktop · เห็นทุกอย่างพร้อมกัน
                </div>
                <PackScanA {...screenProps} />
              </>
            )}

            {(showAll || merged.variant === 'B') && (
              <>
                <div className="variant-label" style={{ marginTop: 40 }}>VARIANT B · Focus scan</div>
                <div style={{ fontFamily: 'Patrick Hand', color: 'var(--mute)', marginBottom: 8 }}>
                  โซนยิงใหญ่ · feedback สินค้าชิ้นล่าสุดเด่น · เหมาะกับ tablet / คนที่ยิงเร็ว
                </div>
                <PackScanB {...screenProps} />
              </>
            )}

            {(showAll || merged.variant === 'C') && (
              <>
                <div className="variant-label" style={{ marginTop: 40 }}>VARIANT C · Packing checklist</div>
                <div style={{ fontFamily: 'Patrick Hand', color: 'var(--mute)', marginBottom: 8 }}>
                  มี packing list ล่วงหน้า · ยิงเพื่อติ๊ก · ช่วยลด error เวลาตามออเดอร์
                </div>
                <PackScanC {...screenProps} />
              </>
            )}
          </>
        )}

        {(showAll || tab === 'closed') && (
          <>
            <div className="screen-label" style={{ marginTop: 40 }}>
              <span className="num">03</span> ปิดลังสำเร็จ + สติกเกอร์
              <span className="desc">— ออกเลข POS + บาร์โค้ดปิดลัง พร้อมพิมพ์</span>
            </div>
            <BoxClosedLabel {...screenProps} />
          </>
        )}

        {(showAll || tab === 'lookup') && (
          <>
            <div className="screen-label" style={{ marginTop: 40 }}>
              <span className="num">04</span> สแกนบาร์โค้ดลัง → ดูรายการ
              <span className="desc">— ยืนยันสินค้าในลังโดยไม่ต้องเปิดลัง</span>
            </div>
            <LookupByBoxBarcode {...screenProps} />
          </>
        )}

        {(showAll || tab === 'export') && (
          <>
            <div className="screen-label" style={{ marginTop: 40 }}>
              <span className="num">05</span> Export → POS
              <span className="desc">— ส่ง batch เข้าระบบ POS ปลายทาง (รูปแบบเลขยัง TBD)</span>
            </div>
            <ExportPOS {...screenProps} />
          </>
        )}

        {(showAll || tab === 'receive') && (
          <>
            <div className="screen-label" style={{ marginTop: 40 }}>
              <span className="num">06</span> รับสินค้าเข้าสาขา
              <span className="desc">— สาขาสแกนบาร์โค้ดลัง → ตรวจและยืนยันรับสินค้า</span>
            </div>
            <BranchReceive {...screenProps} />
          </>
        )}

        <div style={{ marginTop: 50, padding: 20, borderTop: '2px dashed var(--line)', fontFamily: 'Patrick Hand', color: 'var(--mute)' }}>
          <b style={{ fontFamily: 'Caveat', fontSize: 20 }}>Next steps · ของที่ต้องตัดสินใจ</b>
          <ul style={{ marginTop: 8 }}>
            <li>รูปแบบ POS number จริง (จำนวนหลัก / มีตัวอักษรไหม)</li>
            <li>Integration กับ POS ปลายทาง: CSV upload / API / SFTP?</li>
            <li>นโยบายแก้ไขลังหลังปิด (ใครมีสิทธิ์ · audit trail?)</li>
            <li>รองรับน้ำหนักลัง / ราคาต่อชิ้น / lot-expiry หรือไม่</li>
            <li>มือถือ / handheld scanner — ต้องออกแบบหน้า mobile แยกไหม</li>
          </ul>
        </div>
      </div>

      <TweaksPanel tweaks={merged} setTweaks={setTweaks} open={open} setOpen={setOpen} />
      <Toast toasts={toasts} />
    </>
  );
}
