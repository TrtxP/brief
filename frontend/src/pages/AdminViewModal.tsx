import React, { useState, useMemo } from 'react';
import { SubmissionItem, SubmissionStatus } from '../types/admin';
import { BRIEF_SECTIONS, BRIEF_QUESTIONS } from '../data/briefQuestions';
import { BriefAnswers } from '../types/brief';
import { 
  X, 
  Edit3, 
  Trash2, 
  User, 
  Phone, 
  MessageSquare, 
  Clock, 
  DollarSign, 
  Store, 
  Calendar, 
  Check, 
  Layers
} from 'lucide-react';

interface AdminViewModalProps {
  submission: SubmissionItem;
  onClose: () => void;
  onEdit: (submission: SubmissionItem) => void;
  onDelete: (id: number, refCode: string) => void;
}

export const AdminViewModal: React.FC<AdminViewModalProps> = ({
  submission,
  onClose,
  onEdit,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');

  // Parse answers dictionary
  const answers: BriefAnswers = useMemo(() => {
    if (submission.answers && Object.keys(submission.answers).length > 0) {
      return submission.answers;
    }
    if (submission.answers_json) {
      try {
        return JSON.parse(submission.answers_json);
      } catch {
        return {};
      }
    }
    return {};
  }, [submission]);

  // Calculate answered questions count
  const answeredCount = useMemo(() => {
    return Object.keys(answers).filter(k => {
      const v = answers[k];
      if (Array.isArray(v)) return v.length > 0;
      return typeof v === 'string' && v.trim().length > 0;
    }).length;
  }, [answers]);

  // Section completion stats
  const sectionStats = useMemo(() => {
    const stats: Record<string, { answered: number; total: number }> = {};
    BRIEF_SECTIONS.forEach(sec => {
      let count = 0;
      sec.questionIds.forEach(qId => {
        const val = answers[qId];
        if (Array.isArray(val) ? val.length > 0 : (typeof val === 'string' && val.trim().length > 0)) {
          count++;
        }
      });
      stats[sec.id] = { answered: count, total: sec.questionIds.length };
    });
    return stats;
  }, [answers]);

  const getStatusBadge = (st: SubmissionStatus) => {
    switch (st) {
      case 'new':
        return <span className="badge badge-new">Новий</span>;
      case 'in_review':
        return <span className="badge badge-in_review">В обробці</span>;
      case 'approved':
        return <span className="badge badge-approved">Погоджено</span>;
      case 'rejected':
        return <span className="badge badge-rejected">Відхилено</span>;
      case 'completed':
        return <span className="badge badge-completed">Завершено</span>;
      default:
        return <span className="badge">{st}</span>;
    }
  };

  // Filter sections to render based on activeTab
  const sectionsToRender = useMemo(() => {
    if (activeTab === 'all') {
      return BRIEF_SECTIONS;
    }
    return BRIEF_SECTIONS.filter(sec => sec.id === activeTab);
  }, [activeTab]);

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
      padding: '20px',
      overscrollBehavior: 'contain'
    }}>
      <div className="glass-panel-elevated animate-fade-in" style={{
        maxWidth: '1020px',
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
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--bg-surface)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-new" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                {submission.reference_code}
              </span>
              {getStatusBadge(submission.status)}
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {submission.client_name || 'Бриф без імені'}
              </h2>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <span>Створено: <strong>{submission.created_at}</strong></span>
              {submission.updated_at && (
                <span>Оновлено: <strong>{submission.updated_at}</strong></span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => onEdit(submission)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Перейти до редагування брифу"
            >
              <Edit3 size={14} />
              <span>Редагувати</span>
            </button>

            <button
              onClick={() => onDelete(submission.id, submission.reference_code)}
              className="btn btn-danger btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Видалити цей бриф"
            >
              <Trash2 size={14} />
              <span>Видалити</span>
            </button>

            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
              title="Закрити вікно"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Key Summary Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            background: 'var(--bg-surface-elevated)',
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            {/* Contact person */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={13} style={{ color: 'var(--accent-cyan)' }} />
                <span>Контактна особа</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {submission.client_name || '—'}
              </div>
            </div>

            {/* Phone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={13} style={{ color: 'var(--accent-cyan)' }} />
                <span>Телефон</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {submission.phone ? (
                  <a href={`tel:${submission.phone}`} style={{ color: 'var(--text-accent)' }}>
                    {submission.phone}
                  </a>
                ) : '—'}
              </div>
            </div>

            {/* Contact method */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MessageSquare size={13} style={{ color: 'var(--accent-cyan)' }} />
                <span>Зв'язок / Час</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {submission.contact_method || 'Спосіб не вказано'}
                {submission.preferred_time ? ` (${submission.preferred_time})` : ''}
              </div>
            </div>

            {/* Store Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Store size={13} style={{ color: 'var(--accent-cyan)' }} />
                <span>Магазин / Бренд</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {submission.store_name || 'Не вказано'}
              </div>
            </div>

            {/* Budget */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <DollarSign size={13} style={{ color: 'var(--accent-amber)' }} />
                <span>Бюджет проекту</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-amber)' }}>
                {submission.budget || 'Не обрано'}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} style={{ color: 'var(--accent-emerald)' }} />
                <span>Бажані терміни</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {submission.timeline || 'Не вказано'}
              </div>
            </div>

            {/* Manager Notes if present */}
            {submission.notes && (
              <div style={{
                gridColumn: '1 / -1',
                marginTop: '6px',
                padding: '12px 14px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <MessageSquare size={14} />
                  <span>Внутрішні нотатки менеджера</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {submission.notes}
                </p>
              </div>
            )}
          </div>

          {/* Section Navigation Tabs */}
          <div>
            <div style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '8px'
            }}>
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === 'all' ? 'var(--accent-cyan)' : 'var(--bg-surface-elevated)',
                  color: activeTab === 'all' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s ease, color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Layers size={13} />
                <span>Усі розділи ({answeredCount}/{BRIEF_QUESTIONS.length})</span>
              </button>

              {BRIEF_SECTIONS.map((sec, idx) => {
                const isSelected = activeTab === sec.id;
                const stat = sectionStats[sec.id] || { answered: 0, total: sec.questionIds.length };
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-cyan)' : 'var(--bg-surface-elevated)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background 0.2s ease, color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{idx + 1}. {sec.title}</span>
                    <span style={{
                      fontSize: '11px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(148, 163, 184, 0.15)',
                      color: isSelected ? '#ffffff' : 'var(--text-muted)'
                    }}>
                      {stat.answered}/{stat.total}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sections & Questions Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {sectionsToRender.map((section) => {
              const sectionQuestions = BRIEF_QUESTIONS.filter(q => section.questionIds.includes(q.id));
              const secNumber = BRIEF_SECTIONS.findIndex(s => s.id === section.id) + 1;

              return (
                <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Section Title Banner */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'rgba(2, 132, 199, 0.15)',
                      color: 'var(--accent-cyan-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      0{secNumber}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {section.title}
                      </h3>
                      {section.description && (
                        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Questions in this section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sectionQuestions.map(question => {
                      const val = answers[question.id];
                      const isArray = Array.isArray(val);
                      const isText = typeof val === 'string' && val.trim().length > 0;
                      const isAnswered = isArray ? val.length > 0 : isText;

                      return (
                        <div
                          key={question.id}
                          style={{
                            padding: '16px 18px',
                            background: isAnswered ? 'var(--bg-surface)' : 'rgba(30, 41, 59, 0.25)',
                            border: `1px solid ${isAnswered ? 'var(--border-subtle)' : 'rgba(148, 163, 184, 0.08)'}`,
                            borderRadius: 'var(--radius-md)',
                            opacity: isAnswered ? 1 : 0.65
                          }}
                        >
                          {/* Question Header */}
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--accent-cyan)',
                              fontWeight: 700,
                              background: 'rgba(2, 132, 199, 0.1)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              #{question.index}
                            </span>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {question.title}
                              {question.required && (
                                <span style={{ color: 'var(--accent-rose)', marginLeft: '4px' }}>*</span>
                              )}
                            </div>
                          </div>

                          {question.description && (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', marginLeft: '2px' }}>
                              {question.description}
                            </p>
                          )}

                          {/* Answer Value Rendering */}
                          <div style={{ marginTop: '6px' }}>
                            {!isAnswered ? (
                              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Не заповнено
                              </div>
                            ) : isArray ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {(val as string[]).map((item, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '6px 12px',
                                      background: 'rgba(2, 132, 199, 0.12)',
                                      border: '1px solid rgba(56, 189, 248, 0.3)',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '13px',
                                      color: 'var(--text-primary)',
                                      fontWeight: 500
                                    }}
                                  >
                                    <Check size={13} style={{ color: 'var(--accent-cyan-light)', flexShrink: 0 }} />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{
                                padding: '10px 14px',
                                background: 'var(--bg-surface-elevated)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '13.5px',
                                color: 'var(--text-primary)',
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap'
                              }}>
                                {val as string}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Заповнено <strong>{answeredCount}</strong> з <strong>{BRIEF_QUESTIONS.length}</strong> питань
          </div>
        </div>
      </div>
    </div>
  );
};

