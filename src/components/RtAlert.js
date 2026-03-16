import React, { useState, useCallback, useEffect, useRef } from 'react';
import './RtAlert.css';

const TYPE_CONFIG = {
  success: { icon: '✓', label: 'Done' },
  error:   { icon: '✕', label: 'Error' },
  warning: { icon: '⚠', label: 'Notice' },
  confirm: { icon: '?', label: 'Confirm' },
};

let _addToQueue = null;

const getAlertKey = ({ type = 'success', title = '', desc = '', message = '' }) => {
  const resolvedBody = desc || message || '';
  return `${type}::${title}::${resolvedBody}`;
};

export function rtAlert(message, type = 'success') {
  if (_addToQueue) _addToQueue({ type, message });
}

export function rtConfirm({ title, desc, onConfirm, onCancel }) {
  if (_addToQueue) _addToQueue({ type: 'confirm', title, desc, onConfirm, onCancel });
}

// ── Single Alert Card ──────────────────────────────────────────────────────
const AlertItem = ({ data, onDismiss }) => {
  const { id, type, message, title, desc, onConfirm, onCancel } = data;
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.success;
  const isConfirm = type === 'confirm';

  return (
    <div className={`rt-alert rt-alert-${type}`}>
      <div className="rt-alert-icon">{cfg.icon}</div>
      <div className="rt-alert-body">
        <span className="rt-alert-title">{title || cfg.label}</span>
        <span className="rt-alert-desc">{desc || message || ''}</span>
        {isConfirm && (
          <div className="rt-alert-actions">
            <button
              className="rt-confirm-btn rt-confirm-yes"
              onClick={() => { onConfirm?.(); onDismiss(id); }}
            >
              ✔ Confirm
            </button>
            <button
              className="rt-confirm-btn rt-confirm-no"
              onClick={() => { onCancel?.(); onDismiss(id); }}
            >
              ✕ Cancel
            </button>
          </div>
        )}
      </div>
      <button className="rt-alert-close" onClick={() => onDismiss(id)} aria-label="Close">
        ✕
      </button>
    </div>
  );
};

// ── Container – mount once in App root ───────────────────────────────────
export const RtAlertContainer = () => {
  const [queue, setQueue] = useState([]);
  const queueRef = useRef([]);

  const dismiss = useCallback((id) => {
    setQueue(prev => {
      const nextQueue = prev.filter(a => a.id !== id);
      queueRef.current = nextQueue;
      return nextQueue;
    });
  }, []);

  const addToQueue = useCallback((data) => {
    const alertKey = getAlertKey(data);
    const alreadyVisible = queueRef.current.some(item => getAlertKey(item) === alertKey);
    if (alreadyVisible) {
      return;
    }

    const id = Date.now() + Math.random();
    setQueue(prev => {
      const nextQueue = [{ ...data, id }, ...prev].slice(0, 5);
      queueRef.current = nextQueue;
      return nextQueue;
    });

    if (data.type !== 'confirm') {
      setTimeout(() => dismiss(id), 3000);
    }
  }, [dismiss]);

  useEffect(() => {
    _addToQueue = addToQueue;
    return () => { if (_addToQueue === addToQueue) _addToQueue = null; };
  }, [addToQueue]);

  if (queue.length === 0) return null;

  return (
    <div className="rt-alert-container" aria-live="polite" aria-atomic="false">
      {queue.map(item => (
        <AlertItem key={item.id} data={item} onDismiss={dismiss} />
      ))}
    </div>
  );
};
