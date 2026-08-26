import React, { useState } from 'react';
import { SubmissionItem, SubmissionStatus } from '../types/admin';
import { BRIEF_SECTIONS, BRIEF_QUESTIONS } from '../data/briefQuestions';
import { BriefAnswers } from '../types/brief';
import { api } from '../services/api';
import { X, Save, AlertCircle, CheckCircle2, User, Phone, MessageSquare, Clock, DollarSign, Store, Tag } from 'lucide-react';

interface AdminEditModalProps {
  submission: SubmissionItem;
  onClose: () => void;
  onUpdated: (updated: SubmissionItem) => void;
}

export const AdminEditModal: React.FC<AdminEditModalProps> = ({
  submission,
  onClose,
  onUpdated
}) => {
  const [clientName, setClientName] = useState(submission.client_name || '');
  const [phone, setPhone] = useState(submission.phone || '');
  const [contactMethod, setContactMethod] = useState(submission.contact_method || '');
  const [preferredTime, setPreferredTime] = useState(submission.preferred_time || '');
  const [storeName, setStoreName] = useState(submission.store_name || '');
  const [budget, setBudget] = useState(submission.budget || '');
  const [timeline, setTimeline] = useState(submission.timeline || '');
  const [status, setStatus] = useState<SubmissionStatus>(submission.status);
  const [notes, setNotes] = useState(submission.notes || '');

  // Answers dictionary
  const [answers, setAnswers] = useState<BriefAnswers>(() => {
    if (submission.answers && Object.keys(submission.answers).length > 0) {
      return { ...submission.answers };
    }
    if (submission.answers_json) {
      try {
        return JSON.parse(submission.answers_json);
      } catch {
        return {};
      }
    }
    return {};
  });

  const [activeTab, setActiveTab] = useState<string>(BRIEF_SECTIONS[0].id);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle single answer edit
  const handleAnswerChange = (qId: string, val: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: val
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.adminUpdateSubmission(submission.id, {
        client_name: clientName,
        phone: phone,
        contact_method: contactMethod,
        preferred_time: preferredTime,
        store_name: storeName,
        budget: budget,
        timeline: timeline,
        status: status,
        notes: notes,
        answers: answers
      });

      setSuccessMsg('Зміни успішно збережено в базі даних!');
      onUpdated(res.data);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Помилка при збереженні змін.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      padding: '20px'
    }}>
      <div className="glass-panel-elevated animate-fade-in" style={{
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-new" style={{ fontFamily: 'var(--font-mono)' }}>
                {submission.reference_code}
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Редагування відповідей брифу: {clientName || 'Клієнт'}
              </h2>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Створено: {submission.created_at} {submission.updated_at ? `| Оновлено: ${submission.updated_at}` : ''}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={15} />
              <span>{isSaving ? 'Збереження...' : 'Зберегти зміни'}</span>
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#fb7185',
            padding: '10px 24px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            padding: '10px 24px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body (Scrollable) */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Top Row: General Settings & Manager Notes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            background: 'var(--bg-surface-elevated)',
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            {/* Status Selector */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Tag size={13} style={{ color: 'var(--accent-cyan)' }} />
                <span>Статус обробки</span>
              </label>
              <select
                className="select"
                value={status}
                onChange={e => setStatus(e.target.value as SubmissionStatus)}
                style={{ fontWeight: 600 }}
              >
                <option value="new">Новий (New)</option>
                <option value="in_review">В обробці (In Review)</option>
                <option value="approved">Погоджено (Approved)</option>
                <option value="rejected">Відхилено (Rejected)</option>
                <option value="completed">Завершено (Completed)</option>
              </select>
            </div>

            {/* Client Name */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <User size={13} style={{ color: 'var(--accent-cyan)' }} />
                <span>Контактна особа</span>
              </label>
              <input
                type="text"
                className="input"
                value={clientName}
                onChange={e => {
                  setClientName(e.target.value);
                  handleAnswerChange('1', e.target.value);
                }}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Phone size={13} style={{ color: 'var(--accent-cyan)' }} />
                <span>Телефон</span>
              </label>
              <input
                type="text"
                className="input"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  handleAnswerChange('2', e.target.value);
                }}
              />
            </div>

            {/* Manager Notes */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <MessageSquare size={13} style={{ color: 'var(--accent-amber)' }} />
                <span>Внутрішні нотатки менеджера (примітки для команди)</span>
              </label>
              <textarea
                className="textarea"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Введіть нотатки, домовленості, дату дзвінка або коментарі..."
                rows={2}
                style={{ minHeight: '60px' }}
              />
            </div>
          </div>

          {/* Section Tabs */}
          <div>
            <div style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '8px'
            }}>
              {BRIEF_SECTIONS.map((sec, idx) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveTab(sec.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: activeTab === sec.id ? 'var(--accent-cyan)' : 'var(--bg-surface-elevated)',
                    color: activeTab === sec.id ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {idx + 1}. {sec.title}
                </button>
              ))}
            </div>
          </div>

          {/* Questions for Active Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {BRIEF_QUESTIONS.filter(q => {
              const sec = BRIEF_SECTIONS.find(s => s.id === activeTab);
              return sec ? sec.questionIds.includes(q.id) : false;
            }).map(q => {
              const val = answers[q.id];
              const strVal = typeof val === 'string' ? val : '';
              const arrVal = Array.isArray(val) ? val : [];

              return (
                <div
                  key={q.id}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-cyan)',
                      fontWeight: 700
                    }}>
                      #{q.index}
                    </span>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {q.title}
                    </label>
                  </div>

                  {/* Input Based on Type */}
                  {q.type === 'text' && (
                    <input
                      type="text"
                      className="input"
                      value={strVal}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                    />
                  )}

                  {q.type === 'textarea' && (
                    <textarea
                      className="textarea"
                      value={strVal}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      rows={3}
                    />
                  )}

                  {q.type === 'select' && (
                    <select
                      className="select"
                      value={strVal}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                    >
                      <option value="">-- Оберіть варіант --</option>
                      {q.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {q.type === 'radio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options?.map(opt => (
                        <label
                          key={opt}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            color: strVal === opt ? 'var(--accent-cyan-light)' : 'var(--text-primary)'
                          }}
                        >
                          <input
                            type="radio"
                            name={`radio-${q.id}`}
                            checked={strVal === opt}
                            onChange={() => handleAnswerChange(q.id, opt)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                      {/* Allow custom write-in */}
                      <input
                        type="text"
                        className="input"
                        placeholder="Або вкажіть інший кастомний варіант..."
                        value={strVal.startsWith('Інше: ') ? strVal.replace('Інше: ', '') : (!q.options?.includes(strVal) ? strVal : '')}
                        onChange={e => handleAnswerChange(q.id, e.target.value ? `Інше: ${e.target.value}` : '')}
                        style={{ marginTop: '4px', fontSize: '13px', padding: '8px 12px' }}
                      />
                    </div>
                  )}

                  {q.type === 'checkbox' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options?.map(opt => {
                        const checked = arrVal.includes(opt);
                        return (
                          <label
                            key={opt}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              cursor: 'pointer',
                              color: checked ? 'var(--accent-cyan-light)' : 'var(--text-primary)'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                if (checked) {
                                  handleAnswerChange(q.id, arrVal.filter(item => item !== opt));
                                } else {
                                  handleAnswerChange(q.id, [...arrVal, opt]);
                                }
                              }}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                      {/* Checkbox custom other */}
                      <input
                        type="text"
                        className="input"
                        placeholder="Кастомний варіант 'Інше'..."
                        value={arrVal.find(v => v.startsWith('Інше: '))?.replace('Інше: ', '') || ''}
                        onChange={e => {
                          const cleaned = arrVal.filter(v => !v.startsWith('Інше: '));
                          if (e.target.value.trim()) {
                            handleAnswerChange(q.id, [...cleaned, `Інше: ${e.target.value}`]);
                          } else {
                            handleAnswerChange(q.id, cleaned);
                          }
                        }}
                        style={{ marginTop: '4px', fontSize: '13px', padding: '8px 12px' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)'
        }}>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Закрити без збереження
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={16} />
            <span>{isSaving ? 'Збереження в БД...' : 'Зберегти всі зміни брифу'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
