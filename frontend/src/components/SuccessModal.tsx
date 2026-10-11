import React, { useState } from 'react';
import { SubmissionResult, BriefAnswers } from '../types/brief';
import { Check, Copy, Download, Printer, RotateCcw, X } from 'lucide-react';

interface SuccessModalProps {
  result: SubmissionResult;
  answers: BriefAnswers;
  onReset: () => void;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  result,
  answers,
  onReset,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(result.reference_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      reference_code: result.reference_code,
      client_name: result.client_name,
      phone: result.phone,
      created_at: result.created_at,
      answers: answers
    }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `brief_${result.reference_code}.json`);
    dlAnchorElem.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '520px', padding: '32px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Icon */}
        <button
          type="button"
          onClick={onClose}
          className="btn-text"
          style={{ position: 'absolute', top: '16px', right: '16px' }}
          title="Закрити"
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--accent-primary-muted)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            border: '1px solid var(--accent-primary)'
          }}>
            <Check size={24} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Бриф успішно збережено
          </h2>
          
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Дякуємо, <strong>{result.client_name}</strong>. Відповіді зафіксовано в системі. Наш менеджер зв'яжеться з вами найближчим часом.
          </p>
        </div>

        {/* Reference Code Box */}
        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Номер брифу:
            </div>
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '2px' }}>
              {result.reference_code}
            </div>
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="btn btn-secondary btn-sm"
          >
            {copied ? <Check size={13} style={{ color: 'var(--accent-primary)' }} /> : <Copy size={13} />}
            <span>{copied ? 'Скопійовано' : 'Копіювати'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={downloadJson}
              className="btn btn-secondary"
              style={{ fontSize: '13px' }}
            >
              <Download size={14} />
              <span>Завантажити JSON</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-secondary"
              style={{ fontSize: '13px' }}
            >
              <Printer size={14} />
              <span>Друк / PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '4px' }}
          >
            <RotateCcw size={15} />
            <span>Заповнити новий бриф</span>
          </button>
        </div>
      </div>
    </div>
  );
};
