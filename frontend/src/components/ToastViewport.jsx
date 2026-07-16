export default function ToastViewport({ toasts }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card ${toast.type}`.trim()}>
          <div className="toast-icon" aria-hidden="true">
            {toast.type === 'success' ? 'OK' : toast.type === 'warning' ? '!' : 'i'}
          </div>
          <div className="toast-body">
            {toast.title && <div className="toast-title">{toast.title}</div>}
            <div className="toast-message">{toast.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
