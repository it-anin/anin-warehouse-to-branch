import { useRef } from 'react';

const TEMPLATE_CSV = [
  'sku,barcode,name,unit,qty',
  'SKU-8801-A,8851234567012,น้ำปลา ตราเด็กสมบูรณ์ 700ml,ขวด,1',
  'SKU-8802-B,8851234567029,ซอสปรุงรส แม็กกี้ 200ml,ขวด,2',
  'SKU-4410-C,8859900112233,ข้าวหอมมะลิ มาบุญครอง 1kg,ถุง,1',
].join('\n');

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1)
    .map(line => {
      const vals = line.split(',').map(v => v.trim());
      const obj = Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
      return {
        sku:     obj.sku     || '',
        barcode: obj.barcode || '',
        name:    obj.name    || '',
        unit:    obj.unit    || '',
        qty:     Math.max(1, parseInt(obj.qty, 10) || 1),
      };
    })
    .filter(item => item.sku && item.name);
}

export default function ImportCatalog({ catalog, onImport }) {
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const items = parseCSV(ev.target.result);
      if (items.length === 0) {
        alert('ไม่พบรายการสินค้าในไฟล์ กรุณาตรวจสอบรูปแบบ CSV');
        return;
      }
      onImport(items);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'template-รายการเบิกสินค้า.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  return (
    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
      {catalog.length > 0 && (
        <span className="chip ok" style={{ fontFamily: 'Patrick Hand', fontSize: 13 }}>
          📋 รายการเบิก: {catalog.length} รายการ
        </span>
      )}
      <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
      <button className="btn sm primary" onClick={() => fileRef.current?.click()}>
        ⇑ นำเข้ารายการเบิกสินค้า (.csv)
      </button>
      <button className="btn sm ghost" onClick={downloadTemplate} title="ดาวน์โหลด template CSV">
        ⇩ Template
      </button>
    </div>
  );
}
