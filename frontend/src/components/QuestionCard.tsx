import React, { useState, useEffect } from 'react';
import { Question } from '../types/brief';
import { HelpCircle } from 'lucide-react';

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
      className={`question-item ${error ? 'has-error' : ''}`}
    >
      {/* Question Header */}
      <div className="question-header">
        <div className="question-title-row">
          <span className="question-num">#{question.index}</span>
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

        {/* Radio Buttons (Native radio inside label) */}
        {question.type === 'radio' && (
          <div className="options-group">
            {question.options?.map(opt => {
              const isSelected = stringValue === opt;
              return (
                <label
                  key={opt}
                  className={`option-label ${isSelected ? 'is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    className="option-native-control"
                    checked={isSelected}
                    onChange={() => handleRadioSelect(opt)}
                  />
                  <span className="option-text">{opt}</span>
                </label>
              );
            })}

            {/* Optional "Other" for Radio */}
            {question.hasOther && (
              <div className={`option-label ${isOtherRadioSelected ? 'is-selected' : ''}`}>
                <div className="option-other-container">
                  <label className="option-other-row" style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      className="option-native-control"
                      checked={isOtherRadioSelected}
                      onChange={() => {
                        if (!isOtherRadioSelected) {
                          handleRadioSelect(customRadioText.trim() ? `Інше: ${customRadioText}` : 'Інше');
                        }
                      }}
                    />
                    <span className="option-text">Інше (свій варіант)</span>
                  </label>
                  {isOtherRadioSelected && (
                    <input
                      type="text"
                      className="input option-other-input"
                      value={customRadioText}
                      onChange={e => handleOtherRadioChange(e.target.value)}
                      placeholder="Вкажіть свій варіант..."
                      autoFocus
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checkbox (Native checkbox inside label) */}
        {question.type === 'checkbox' && (
          <div className="options-group">
            {question.options?.map(opt => {
              const isSelected = arrayValue.includes(opt);
              return (
                <label
                  key={opt}
                  className={`option-label ${isSelected ? 'is-selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="option-native-control"
                    checked={isSelected}
                    onChange={() => handleCheckboxToggle(opt)}
                  />
                  <span className="option-text">{opt}</span>
                </label>
              );
            })}

            {/* Optional "Other" for Checkbox */}
            {question.hasOther && (
              <div className={`option-label ${isOtherCheckboxSelected ? 'is-selected' : ''}`}>
                <div className="option-other-container">
                  <label className="option-other-row" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      className="option-native-control"
                      checked={isOtherCheckboxSelected}
                      onChange={handleOtherCheckboxToggle}
                    />
                    <span className="option-text">Інше (свій варіант)</span>
                  </label>
                  {isOtherCheckboxSelected && (
                    <input
                      type="text"
                      className="input option-other-input"
                      value={customCheckboxText}
                      onChange={e => handleOtherCheckboxTextChange(e.target.value)}
                      placeholder="Опишіть власний варіант або побажання..."
                      autoFocus
                    />
                  )}
                </div>
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

