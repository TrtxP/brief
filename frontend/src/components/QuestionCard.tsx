import React, { useState, useEffect } from 'react';
import { Question } from '../types/brief';
import { Check, HelpCircle } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  value: string | string[] | undefined;
  onChange: (questionId: string, val: string | string[]) => void;
  error?: string;
}

export const QuestionCard = React.memo<QuestionCardProps>(({
  question,
  value,
  onChange,
  error
}) => {
  // Extract custom 'other' text if present in radio/checkbox values
  const stringValue = typeof value === 'string' ? value : '';
  const arrayValue = Array.isArray(value) ? value : [];

  // Check if "Інше: ..." is currently selected
  const otherRadioPrefix = 'Інше: ';
  const isOtherRadioSelected = stringValue.startsWith(otherRadioPrefix) || (stringValue === 'Інше' && !question.options?.includes(stringValue));
  const [customRadioText, setCustomRadioText] = useState(
    isOtherRadioSelected ? stringValue.replace(otherRadioPrefix, '') : ''
  );

  const otherCheckboxPrefix = 'Інше: ';
  const otherCheckboxItem = arrayValue.find(v => v.startsWith(otherCheckboxPrefix) || v === 'Інше');
  const isOtherCheckboxSelected = !!otherCheckboxItem;
  const [customCheckboxText, setCustomCheckboxText] = useState(
    otherCheckboxItem ? otherCheckboxItem.replace(otherCheckboxPrefix, '') : ''
  );

  useEffect(() => {
    if (isOtherRadioSelected) {
      setCustomRadioText(stringValue.startsWith(otherRadioPrefix) ? stringValue.replace(otherRadioPrefix, '') : '');
    } else {
      setCustomRadioText('');
    }
  }, [stringValue, isOtherRadioSelected]);

  useEffect(() => {
    if (isOtherCheckboxSelected) {
      setCustomCheckboxText(otherCheckboxItem && otherCheckboxItem.startsWith(otherCheckboxPrefix) ? otherCheckboxItem.replace(otherCheckboxPrefix, '') : '');
    } else {
      setCustomCheckboxText('');
    }
  }, [otherCheckboxItem, isOtherCheckboxSelected]);

  // Handle Radio Selection
  const handleRadioSelect = (opt: string) => {
    onChange(question.id, opt);
  };

  const handleOtherRadioChange = (text: string) => {
    setCustomRadioText(text);
    onChange(question.id, text.trim() ? `Інше: ${text}` : 'Інше');
  };

  // Handle Checkbox Selection
  const handleCheckboxToggle = (opt: string) => {
    if (arrayValue.includes(opt)) {
      onChange(question.id, arrayValue.filter(item => item !== opt));
    } else {
      onChange(question.id, [...arrayValue, opt]);
    }
  };

  const handleOtherCheckboxToggle = () => {
    if (isOtherCheckboxSelected) {
      onChange(question.id, arrayValue.filter(v => !v.startsWith(otherCheckboxPrefix) && v !== 'Інше'));
    } else {
      const val = customCheckboxText.trim() ? `Інше: ${customCheckboxText}` : 'Інше';
      onChange(question.id, [...arrayValue, val]);
    }
  };

  const handleOtherCheckboxTextChange = (text: string) => {
    setCustomCheckboxText(text);
    const cleaned = arrayValue.filter(v => !v.startsWith(otherCheckboxPrefix) && v !== 'Інше');
    onChange(question.id, [...cleaned, text.trim() ? `Інше: ${text}` : 'Інше']);
  };

  return (
    <div 
      id={`q-${question.id}`} 
      className="glass-panel question-card" 
      style={{
        borderColor: error ? 'var(--accent-rose)' : undefined,
      }}
    >
      {/* Question Header */}
      <div className="question-header">
        <div className="question-title-row">
          <span className="question-badge">
            #{question.index}
          </span>
          <h3 className="question-title">
            {question.title}
            {question.required && (
              <span className="question-required" title="Обов'язкове поле">*</span>
            )}
          </h3>
        </div>

        {question.description && (
          <p className="question-desc">
            {question.description}
          </p>
        )}
      </div>

      {/* Inputs Rendering Based on Type */}
      <div className="question-body">
        {/* Short Text */}
        {question.type === 'text' && (
          <input
            type="text"
            className="input"
            value={stringValue}
            onChange={e => onChange(question.id, e.target.value)}
            placeholder={question.placeholder || 'Ваша відповідь...'}
          />
        )}

        {/* Textarea */}
        {question.type === 'textarea' && (
          <textarea
            className="textarea"
            value={stringValue}
            onChange={e => onChange(question.id, e.target.value)}
            placeholder={question.placeholder || 'Введіть детальний опис...'}
            rows={3}
          />
        )}

        {/* Select Dropdown */}
        {question.type === 'select' && (
          <select
            className="select"
            value={stringValue}
            onChange={e => onChange(question.id, e.target.value)}
          >
            <option value="">-- Оберіть варіант зі списку --</option>
            {question.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )}

        {/* Radio Buttons (Single Choice) */}
        {question.type === 'radio' && (
          <div className="choices-stack">
            {question.options?.map(opt => {
              const isSelected = stringValue === opt;
              return (
                <div
                  key={opt}
                  className={`choice-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleRadioSelect(opt)}
                >
                  <div className="choice-indicator radio" />
                  <span className="choice-text">{opt}</span>
                </div>
              );
            })}

            {/* Optional "Other" for Radio */}
            {question.hasOther && (
              <div
                className={`choice-card ${isOtherRadioSelected ? 'selected' : ''}`}
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}
                onClick={() => {
                  if (!isOtherRadioSelected) {
                    handleRadioSelect(customRadioText.trim() ? `Інше: ${customRadioText}` : 'Інше');
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="choice-indicator radio" />
                  <span className="choice-text">Інше (свій варіант)</span>
                </div>
                {isOtherRadioSelected && (
                  <input
                    type="text"
                    className="input"
                    value={customRadioText}
                    onChange={e => handleOtherRadioChange(e.target.value)}
                    placeholder="Вкажіть свій варіант..."
                    onClick={e => e.stopPropagation()}
                    autoFocus
                    style={{ marginTop: '4px', background: 'var(--bg-surface)' }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Checkbox (Multi Choice) */}
        {question.type === 'checkbox' && (
          <div className="choices-stack">
            {question.options?.map(opt => {
              const isSelected = arrayValue.includes(opt);
              return (
                <div
                  key={opt}
                  className={`choice-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCheckboxToggle(opt)}
                >
                  <div className="choice-indicator checkbox">
                    {isSelected && <Check size={14} style={{ color: '#ffffff' }} />}
                  </div>
                  <span className="choice-text">{opt}</span>
                </div>
              );
            })}

            {/* Optional "Other" for Checkbox */}
            {question.hasOther && (
              <div
                className={`choice-card ${isOtherCheckboxSelected ? 'selected' : ''}`}
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}
                onClick={handleOtherCheckboxToggle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="choice-indicator checkbox">
                    {isOtherCheckboxSelected && <Check size={14} style={{ color: '#ffffff' }} />}
                  </div>
                  <span className="choice-text">Інше (свій варіант)</span>
                </div>
                {isOtherCheckboxSelected && (
                  <input
                    type="text"
                    className="input"
                    value={customCheckboxText}
                    onChange={e => handleOtherCheckboxTextChange(e.target.value)}
                    placeholder="Опишіть власний варіант або побажання..."
                    onClick={e => e.stopPropagation()}
                    autoFocus
                    style={{ marginTop: '4px', background: 'var(--bg-surface)' }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Validation error hint */}
        {error && (
          <div className="question-error-hint">
            <HelpCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
});
