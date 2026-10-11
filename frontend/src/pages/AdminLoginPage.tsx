import React, { useState } from 'react';
import { api } from '../services/api';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onBackToBrief: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onBackToBrief }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.adminLogin(username, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Невірний логін або пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px'
    }}>
      <div className="modal-card" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '21px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Вхід до кабінету
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Керування брифами та редагування відповідей
          </p>
        </div>

        {error && (
          <div className="action-error-banner" style={{ marginBottom: '18px' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              Логін (Username)
            </label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: '36px' }}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="input"
                style={{ paddingLeft: '36px' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '6px' }}
          >
            {loading ? 'Перевірка...' : 'Увійти'}
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          <div>Тестовий доступ:</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', marginTop: '2px', fontWeight: 600 }}>
            admin / admin123
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <button
            type="button"
            onClick={onBackToBrief}
            className="btn-text"
          >
            &larr; Повернутися до публічного брифу
          </button>
        </div>
      </div>
    </div>
  );
};
