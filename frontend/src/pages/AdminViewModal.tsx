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
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{
          maxWidth: '1000px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
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
              <span className="badge badge-new" style={{ fontFamily: 'var(--font-mono)' }}>
                {submission.reference_code}
              </span>
              {getStatusBadge(submission.status)}
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onEdit(submission)}
              className="btn btn-primary btn-sm"
              title="Перейти до редагування брифу"
            >
              <Edit3 size={13} />
              <span>Редагувати</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(submission.id, submission.reference_code)}
              className="btn btn-danger btn-sm"
              title="Видалити цей бриф"
            >
              <Trash2 size={13} />
              <span>Видалити</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ width: '30px', height: '30px', padding: 0 }}
              title="Закрити вікно"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Top Info Grid: Contacts & Primary Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <User size={15} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Клієнт / Компанія</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {submission.client_name || 'Не вказано'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Phone size={15} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Телефон</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {submission.phone || 'Не вказано'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <MessageSquare size={15} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Зв'язок / Час</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {submission.contact_method || '—'} {submission.preferred_time ? `(${submission.preferred_time})` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Store size={15} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Назва магазину</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {submission.store_name || '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <DollarSign size={15} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Бюджетні рамки</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {submission.budget || '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Calendar size={15} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Очікуваний термін</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {submission.timeline || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Manager Notes */}
          {submission.notes && (
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 18px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Внутрішні нотатки менеджера:
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {submission.notes}
              </div>
            </div>
          )}

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
                type="button"
                onClick={() => setActiveTab('all')}
                className="btn btn-sm"
                style={{
                  background: activeTab === 'all' ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                  color: activeTab === 'all' ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
                  borderColor: activeTab === 'all' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
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
                    type="button"
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    className="btn btn-sm"
                    style={{
                      background: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                      color: isSelected ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{idx + 1}. {sec.title}</span>
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      opacity: 0.8
                    }}>
                      ({stat.answered}/{stat.total})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sections & Questions Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {sectionsToRender.map((section) => {
              const sectionQuestions = BRIEF_QUESTIONS.filter(q => section.questionIds.includes(q.id));
              const secNumber = BRIEF_SECTIONS.findIndex(s => s.id === section.id) + 1;

              return (
                <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Section Title Banner */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)'
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      fontSize: '12px',
                      color: 'var(--accent-primary)'
                    }}>
                      0{secNumber}
                    </span>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {section.title}
                    </h3>
                  </div>

                  {/* Questions in this section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sectionQuestions.map(question => {
                      const val = answers[question.id];
                      const isArray = Array.isArray(val);
                      const isText = typeof val === 'string' && val.trim().length > 0;
                      const isAnswered = isArray ? val.length > 0 : isText;

                      return (
                        <div
                          key={question.id}
                          style={{
                            padding: '14px 16px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            opacity: isAnswered ? 1 : 0.6
                          }}
                        >
                          {/* Question Header */}
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--text-muted)'
                            }}>
                              #{question.index}
                            </span>
                            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {question.title}
                              {question.required && (
                                <span style={{ color: 'var(--accent-rose)', marginLeft: '4px' }}>*</span>
                              )}
                            </div>
                          </div>

                          {question.description && (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                              {question.description}
                            </p>
                          )}

                          {/* Answer Value Rendering */}
                          <div style={{ marginTop: '4px' }}>
                            {!isAnswered ? (
                              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Не заповнено
                              </div>
                            ) : isArray ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {(val as string[]).map((item, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '4px 8px',
                                      background: 'var(--accent-primary-muted)',
                                      border: '1px solid var(--accent-primary)',
                                      borderRadius: 'var(--radius-xs)',
                                      fontSize: '12.5px',
                                      color: 'var(--text-primary)'
                                    }}
                                  >
                                    <Check size={12} style={{ color: 'var(--accent-primary)' }} />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{
                                padding: '8px 12px',
                                background: 'var(--bg-surface-elevated)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-xs)',
                                fontSize: '13px',
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
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Заповнено <strong>{answeredCount}</strong> з <strong>{BRIEF_QUESTIONS.length}</strong> питань
          </div>
        </div>
      </div>
    </div>
  );
};

