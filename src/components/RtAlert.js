import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, HelpCircle, X } from 'lucide-react';
import './RtAlert.css';

const TYPE_CONFIG = {
  success: { icon: <CheckCircle2 size={18} />, label: 'Success' },
  error:   { icon: <AlertCircle size={18} />, label: 'Error' },
  warning: { icon: <AlertTriangle size={18} />, label: 'Notice' },
  confirm: { icon: <HelpCircle size={18} />, label: 'Confirm' },
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
      <div className="rt-alert-icon-wrap">
        {cfg.icon}
      </div>
      <div className="rt-alert-body">
        <span className="rt-alert-title">{title || cfg.label}</span>
        <span className="rt-alert-desc">{desc || message || ''}</span>
        {isConfirm && (
          <div className="rt-alert-actions">
            <button
              type="button"
              className="rt-confirm-btn rt-confirm-yes"
              onClick={() => { onConfirm?.(); onDismiss(id); }}
            >
              Confirm
            </button>
            <button
              type="button"
              className="rt-confirm-btn rt-confirm-no"
              onClick={() => { onCancel?.(); onDismiss(id); }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <button className="rt-alert-close" onClick={() => onDismiss(id)} aria-label="Close notification">
        <X size={14} />
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
