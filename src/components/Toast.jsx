export default function Toast({ toasts }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      zIndex: 300, pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'Patrick Hand', fontSize: 16,
          padding: '10px 22px', borderRadius: 10,
          border: '2px solid var(--line)',
          boxShadow: '3px 3px 0 var(--line)',
          whiteSpace: 'nowrap',
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
