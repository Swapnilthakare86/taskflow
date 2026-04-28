export default function ModalOverlay({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 2500,
      }}
    />
  );
}
