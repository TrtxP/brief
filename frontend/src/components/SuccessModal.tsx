import React, { useState } from 'react';
import { SubmissionResult, BriefAnswers } from '../types/brief';
import { CheckCircle2, Copy, Check, Download, Printer, RotateCcw } from 'lucide-react';

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
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      padding: '20px'
    }}>
      <div className="glass-panel-elevated animate-fade-in" style={{
        maxWidth: '540px',
        width: '100%',
        padding: '36px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--accent-emerald)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)'
        }}>
          <CheckCircle2 size={36} />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
          Бриф успішно збережено!
        </h2>
        
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
          Дякуємо, <strong>{result.client_name}</strong>! Ваші відповіді зафіксовано в базі даних. Наш проектний менеджер зв'яжеться з вами найближчим часом.
        </p>

        {/* Reference Code Box */}
        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px dashed var(--border-active)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Номер (код) вашого брифу:
            </div>
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan-light)' }}>
              {result.reference_code}
            </div>
          </div>
          <button
            onClick={copyCode}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
            <span>{copied ? 'Скопійовано' : 'Копіювати'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={downloadJson}
              className="btn btn-secondary"
              style={{ fontSize: '13px' }}
            >
              <Download size={15} />
              <span>Завантажити JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-secondary"
              style={{ fontSize: '13px' }}
            >
              <Printer size={15} />
              <span>Роздрукувати / PDF</span>
            </button>
          </div>

          <button
            onClick={onReset}
            className="btn btn-primary btn-lg"
            style={{ marginTop: '8px', width: '100%' }}
          >
            <RotateCcw size={16} />
            <span>Заповнити новий бриф</span>
          </button>
        </div>
      </div>
    </div>
  );
};
