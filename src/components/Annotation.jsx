export default function Annotation({ text, style = {}, arrow = 'bl' }) {
  const arrowStyles = {
    bl: { bottom: -32, left: -10 },
    br: { bottom: -32, right: -10, transform: 'scaleX(-1)' },
    tl: { top: -32, left: -10, transform: 'scaleY(-1)' },
    tr: { top: -32, right: -10, transform: 'scale(-1,-1)' },
  };
  return (
    <div className="note" style={style}>
      <div>{text}</div>
      <svg width="60" height="40" style={{ position: 'absolute', ...arrowStyles[arrow] }}>
        <path d="M 5 5 Q 15 25, 30 28 T 55 35" stroke="#e8692b" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 50 30 L 55 35 L 48 38" stroke="#e8692b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
