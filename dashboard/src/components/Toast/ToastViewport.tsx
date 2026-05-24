import { dismiss, useToasts } from './toastStore';

export function ToastViewport() {
  const toasts = useToasts();
  return (
    <div className="toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`} role="status">
          <div className="toast__row">
            <span className="toast__title">{t.title}</span>
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
            >
              ×
            </button>
          </div>
          {t.body && <pre className="toast__body">{t.body}</pre>}
        </div>
      ))}
    </div>
  );
}
