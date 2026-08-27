import React, { useState } from 'react';
import { Question } from '../types/brief';
import { Check, HelpCircle } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  value: string | string[] | undefined;
  onChange: (val: string | string[]) => void;
  error?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
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

  // Handle Radio Selection
  const handleRadioSelect = (opt: string) => {
    onChange(opt);
  };

  const handleOtherRadioChange = (text: string) => {
    setCustomRadioText(text);
    onChange(text.trim() ? `Інше: ${text}` : 'Інше');
  };

  // Handle Checkbox Selection
  const handleCheckboxToggle = (opt: string) => {
    if (arrayValue.includes(opt)) {
      onChange(arrayValue.filter(item => item !== opt));
    } else {
      onChange([...arrayValue, opt]);
    }
  };

  const handleOtherCheckboxToggle = () => {
    if (isOtherCheckboxSelected) {
      onChange(arrayValue.filter(v => !v.startsWith(otherCheckboxPrefix) && v !== 'Інше'));
    } else {
      const val = customCheckboxText.trim() ? `Інше: ${customCheckboxText}` : 'Інше';
      onChange([...arrayValue, val]);
    }
  };

  const handleOtherCheckboxTextChange = (text: string) => {
    setCustomCheckboxText(text);
    const cleaned = arrayValue.filter(v => !v.startsWith(otherCheckboxPrefix) && v !== 'Інше');
    onChange([...cleaned, text.trim() ? `Інше: ${text}` : 'Інше']);
  };

  return (
    <div 
      id={`q-${question.id}`} 
      className="glass-panel" 
      style={{
        padding: '24px',
        marginBottom: '20px',
        borderColor: error ? 'var(--accent-rose)' : undefined,
        transition: 'border-color 0.2s ease'
      }}
    >
      {/* Question Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
          <span style={{
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            background: 'rgba(2, 132, 199, 0.12)',
            padding: '2px 8px',
            borderRadius: '6px',
            flexShrink: 0
          }}>
            #{question.index}
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {question.title}
            {question.required && (
              <span style={{ color: 'var(--accent-rose)', marginLeft: '4px' }} title="Обов'язкове поле">*</span>
            )}
          </h3>
        </div>

        {question.description && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '34px', lineHeight: 1.5 }}>
            {question.description}
          </p>
        )}
      </div>

      {/* Inputs Rendering Based on Type */}
      <div style={{ paddingLeft: '4px' }}>
        {/* Short Text */}
        {question.type === 'text' && (
          <input
            type="text"
            className="input"
            value={stringValue}
            onChange={e => onChange(e.target.value)}
            placeholder={question.placeholder || 'Ваша відповідь...'}
          />
        )}

        {/* Textarea */}
        {question.type === 'textarea' && (
          <textarea
            className="textarea"
            value={stringValue}
            onChange={e => onChange(e.target.value)}
            placeholder={question.placeholder || 'Введіть детальний опис...'}
            rows={3}
          />
        )}

        {/* Select Dropdown */}
        {question.type === 'select' && (
          <select
            className="select"
            value={stringValue}
            onChange={e => onChange(e.target.value)}
          >
            <option value="">-- Оберіть варіант зі списку --</option>
            {question.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )}

        {/* Radio Buttons (Single Choice) */}
        {question.type === 'radio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
          <div style={{
            marginTop: '10px',
            fontSize: '12px',
            color: 'var(--accent-rose)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <HelpCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
