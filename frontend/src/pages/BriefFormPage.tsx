import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BRIEF_SECTIONS, BRIEF_QUESTIONS } from '../data/briefQuestions';
import { BriefAnswers, SubmissionResult } from '../types/brief';
import { QuestionCard } from '../components/QuestionCard';
import { SuccessModal } from '../components/SuccessModal';
import { api } from '../services/api';
import { Send, Trash2, AlertCircle } from 'lucide-react';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // Calculate answered questions count via useMemo
  const answeredCount = useMemo(() => {
    return Object.keys(answers).filter(k => {
      const v = answers[k];
      if (Array.isArray(v)) return v.length > 0;
      return typeof v === 'string' && v.trim().length > 0;
    }).length;
  }, [answers]);

  // Store onSavedChange in ref to prevent effect re-runs when parent passes new function
  const onSavedChangeRef = useRef(onSavedChange);
  useEffect(() => {
    onSavedChangeRef.current = onSavedChange;
  });

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
        if (onSavedChangeRef.current) {
          onSavedChangeRef.current(answeredCount, now);
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
  }, [answers, answeredCount]);

  // Section completion stats for sidebar (kept for SectionNav integrity)
  const sectionCompletion = useMemo(() => {
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

  // Stable single question change handler with functional setState
  const handleAnswerChange = useCallback((questionId: string, val: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: val
    }));

    setErrors(prev => {
      if (!prev[questionId]) return prev;
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  }, []);

  // Scroll to section
  const handleScrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -70;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: y, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  // Clear draft
  const handleClearDraft = () => {
    if (window.confirm('Ви впевнені, що хочете очистити всі введені відповіді?')) {
      setAnswers({});
      localStorage.removeItem(STORAGE_KEY);
      if (onSavedChangeRef.current) {
        onSavedChangeRef.current(0, null);
      }
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
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        errElem.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
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
    <div className="brief-container" style={{ paddingBottom: '90px' }}>
      {/* Hero Header - Clean Editorial Presentation */}
      <header className="brief-hero">
        <h1 className="brief-hero-title">
          Структурований бриф на розробку інтернет-магазину риболовлі
        </h1>

        <p className="brief-hero-desc">
          Цей структурований бриф є інструментом передпроектного аналізу та ініціації розробки e-commerce системи. 
          Мета опитування — збір, систематизація та формалізація первинних бізнес-вимог, функціональних рамок 
          та технічних обмежень для подальшого проектування архітектури інтернет-магазину риболовлі та формування ТЗ.
        </p>

        <div className="brief-hero-meta">
          <span>Усі 6 розділів на одній сторінці. Відповіді зберігаються локально.</span>
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={handleClearDraft}
              className="btn-text"
              title="Очистити всі поля"
            >
              <Trash2 size={13} />
              <span>Очистити чернетку</span>
            </button>
          )}
        </div>
      </header>

      {/* Form Content */}
      <form onSubmit={handleSubmit} noValidate>
        {BRIEF_SECTIONS.map((section, sIdx) => {
          const sectionQuestions = BRIEF_QUESTIONS.filter(q => section.questionIds.includes(q.id));

          return (
            <section 
              key={section.id} 
              id={section.id}
              className="brief-section-block"
              style={{ scrollMarginTop: '80px' }}
            >
              {/* Section Header: Large Mono Number + Title + Line */}
              <div className="brief-section-header">
                <div className="brief-section-title-row">
                  <span className="brief-section-num">0{sIdx + 1}</span>
                  <h2 className="brief-section-title">
                    {section.title}
                  </h2>
                </div>
                {section.description && (
                  <p className="brief-section-desc">
                    {section.description}
                  </p>
                )}
              </div>

              {/* Questions for this section */}
              {sectionQuestions.map(question => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                  onChange={handleAnswerChange}
                  error={errors[question.id]}
                />
              ))}
            </section>
          );
        })}

        {/* Submit Action Box */}
        <div className="action-box">
          <h3 className="action-box-title">
            Готові надіслати бриф?
          </h3>
          <p className="action-box-desc">
            Перевірте вказані контакти. Після збереження ви отримаєте унікальний код брифу та можливість завантажити копію у форматі JSON або роздрукувати.
          </p>

          {submitError && (
            <div className="action-error-banner">
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
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? (
              <span>Збереження брифу...</span>
            ) : (
              <>
                <Send size={16} />
                <span>Відправити заповнений бриф</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal on Submission */}
      {submissionResult && (
        <SuccessModal
          result={submissionResult}
          answers={answers}
          onReset={() => {
            setSubmissionResult(null);
            setAnswers({});
            if (onSavedChangeRef.current) {
              onSavedChangeRef.current(0, null);
            }
          }}
          onClose={() => setSubmissionResult(null)}
        />
      )}
    </div>
  );
};

