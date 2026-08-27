import React, { useState, useEffect, useRef } from 'react';
import { BRIEF_SECTIONS, BRIEF_QUESTIONS } from '../data/briefQuestions';
import { BriefAnswers, SubmissionResult } from '../types/brief';
import { QuestionCard } from '../components/QuestionCard';
import { SuccessModal } from '../components/SuccessModal';
import { api } from '../services/api';
import { Send, Trash2, Sparkles, AlertCircle, Info, Fish } from 'lucide-react';

interface BriefFormPageProps {
  onSavedChange?: (answeredCount: number, lastSavedTime: string | null) => void;
}

const STORAGE_KEY = 'angler_brief_draft_v1';

export const BriefFormPage: React.FC<BriefFormPageProps> = ({ onSavedChange }) => {
  const [answers, setAnswers] = useState<BriefAnswers>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeSectionId, setActiveSectionId] = useState<string>(BRIEF_SECTIONS[0].id);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // Calculate answered questions count
  const answeredCount = Object.keys(answers).filter(k => {
    const v = answers[k];
    if (Array.isArray(v)) return v.length > 0;
    return typeof v === 'string' && v.trim().length > 0;
  }).length;

  // Debounced auto-save to localStorage (500ms)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
        const now = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        setLastSavedTime(now);
        if (onSavedChange) {
          onSavedChange(answeredCount, now);
        }
      } catch {
        // Ignore storage errors
      }
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [answers, answeredCount, onSavedChange]);

  // Section completion stats for sidebar
  const sectionCompletion = React.useMemo(() => {
    const stats: Record<string, { answered: number; total: number }> = {};
    BRIEF_SECTIONS.forEach(sec => {
      let answeredInSec = 0;
      sec.questionIds.forEach(qId => {
        const val = answers[qId];
        if (Array.isArray(val) ? val.length > 0 : (typeof val === 'string' && val.trim().length > 0)) {
          answeredInSec++;
        }
      });
      stats[sec.id] = { answered: answeredInSec, total: sec.questionIds.length };
    });
    return stats;
  }, [answers]);

  // Handle single question change
  const handleAnswerChange = (questionId: string, val: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: val
    }));

    if (errors[questionId]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }
  };

  // Scroll to section
  const handleScrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Clear draft
  const handleClearDraft = () => {
    if (window.confirm('Ви впевнені, що хочете очистити всі введені відповіді?')) {
      setAnswers({});
      localStorage.removeItem(STORAGE_KEY);
      setLastSavedTime(null);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate all required fields
    const newErrors: Record<string, string> = {};
    const clientName = typeof answers['1'] === 'string' ? answers['1'].trim() : '';
    const phone = typeof answers['2'] === 'string' ? answers['2'].trim() : '';

    if (!clientName) {
      newErrors['1'] = 'Будь ласка, вкажіть ваше ім\'я або назву компанії.';
    }
    if (!phone) {
      newErrors['2'] = 'Вкажіть номер телефону для зв\'язку.';
    } else if (phone.replace(/[^0-9]/g, '').length < 7) {
      newErrors['2'] = 'Введіть коректний номер телефону.';
    }

    // Validate all other required questions
    BRIEF_QUESTIONS.forEach(q => {
      if (!q.required || q.id === '1' || q.id === '2') return;
      const val = answers[q.id];
      if (q.type === 'checkbox') {
        if (!Array.isArray(val) || val.length === 0) {
          newErrors[q.id] = 'Оберіть хоча б один варіант.';
        }
      } else if (q.type === 'radio' || q.type === 'select') {
        if (!val || (typeof val === 'string' && val.trim() === '')) {
          newErrors[q.id] = 'Оберіть один із запропонованих варіантів.';
        }
      } else {
        if (!val || (typeof val === 'string' && val.trim() === '')) {
          newErrors[q.id] = 'Це поле є обов\'язковим для заповнення.';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorId = Object.keys(newErrors)[0];
      const errElem = document.getElementById(`q-${firstErrorId}`);
      if (errElem) {
        errElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setSubmitError(`Заповніть усі обов'язкові поля брифу (${Object.keys(newErrors).length} незаповнених).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitBrief({
        client_name: clientName,
        phone: phone,
        contact_method: typeof answers['3'] === 'string' ? answers['3'] : '',
        preferred_time: typeof answers['4'] === 'string' ? answers['4'] : '',
        store_name: typeof answers['6'] === 'string' ? answers['6'] : '',
        budget: typeof answers['29'] === 'string' ? answers['29'] : '',
        timeline: typeof answers['28'] === 'string' ? answers['28'] : '',
        answers: answers
      });

      setSubmissionResult(res.data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setSubmitError(err.message || 'Не вдалося відправити бриф. Спробуйте пізніше.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '80px' }}>
      {/* Hero Header */}
      <div className="glass-panel" style={{
        padding: '36px',
        marginBottom: '36px',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: '4px solid var(--accent-cyan)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(2, 132, 199, 0.12)',
              color: 'var(--accent-cyan-light)',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px'
            }}>
              <Fish size={14} />
              <span>Е-commerce Проектування</span>
            </div>
            
            <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Структурований бриф на розробку інтернет-магазину риболовлі
            </h1>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '850px' }}>
              Цей структурований бриф є інструментом передпроектного аналізу та ініціації розробки e-commerce системи. 
              Мета опитування — збір, систематизація та формалізація первинних бізнес-вимог, функціональних рамок 
              та технічних обмежень для подальшого проектування архітектури інтернет-магазину риболовлі та формування ТЗ.
            </p>
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={14} style={{ color: 'var(--accent-cyan)' }} />
            <span>Всі розділи розташовані на одній сторінці. Відповіді зберігаються автоматично на вашому пристрої.</span>
          </div>
          {answeredCount > 0 && (
            <button
              onClick={handleClearDraft}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', color: 'var(--text-muted)' }}
              title="Очистити всі поля"
            >
              <Trash2 size={12} />
              <span>Очистити чернетку</span>
            </button>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div>

        {/* All Sections & Questions */}
        <form onSubmit={handleSubmit}>
          {BRIEF_SECTIONS.map((section, sIdx) => {
            const sectionQuestions = BRIEF_QUESTIONS.filter(q => section.questionIds.includes(q.id));

            return (
              <div 
                key={section.id} 
                id={section.id}
                style={{
                  marginBottom: '40px',
                  scrollMarginTop: '90px'
                }}
              >
                {/* Section Title Banner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '12px 18px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(2, 132, 199, 0.15)',
                    color: 'var(--accent-cyan-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    0{sIdx + 1}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {section.title}
                    </h2>
                    {section.description && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Questions for this section */}
                {sectionQuestions.map(question => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    value={answers[question.id]}
                    onChange={val => handleAnswerChange(question.id, val)}
                    error={errors[question.id]}
                  />
                ))}
              </div>
            );
          })}

          {/* Submit Action Box */}
          <div className="action-card" style={{ marginTop: '20px' }}>
            <h3 className="action-card-title">
              Готові надіслати бриф?
            </h3>
            <p className="action-card-desc">
              Перевірте вказані контакти. Після збереження ви отримаєте унікальний код брифу та можливість завантажити копію.
            </p>

            {submitError && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid var(--accent-rose)',
                color: '#fb7185',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px'
              }}>
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
              style={{
                minWidth: '240px',
                fontSize: '16px',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="pulse-glow">Обробка та збереження...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Відправити заповнений бриф</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal on Submission */}
      {submissionResult && (
        <SuccessModal
          result={submissionResult}
          answers={answers}
          onReset={() => {
            setSubmissionResult(null);
            setAnswers({});
          }}
          onClose={() => setSubmissionResult(null)}
        />
      )}
    </div>
  );
};
