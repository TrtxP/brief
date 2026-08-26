import React, { useState } from 'react';
import { api } from '../services/api';
import { Shield, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

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
      padding: '20px'
    }}>
      <div className="glass-panel-elevated animate-fade-in" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '36px',
        position: 'relative'
      }}>
        {/* Shield Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)'
        }}>
          <Shield size={28} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, textAlign: 'center', marginBottom: '6px', color: 'var(--text-primary)' }}>
          Вхід до адмін-панелі
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
          Керування записаними брифами та редагування відповідей
        </p>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid var(--accent-rose)',
            color: '#fb7185',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              Логін (Username)
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: '40px' }}
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
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="input"
                style={{ paddingLeft: '40px' }}
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
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Перевірка...' : 'Увійти в кабінет'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          <div>Тестові дані за замовчуванням:</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-light)', marginTop: '4px' }}>
            Логін: <strong>admin</strong> / Пароль: <strong>admin123</strong>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={onBackToBrief}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}
          >
            &larr; Повернутися до публічного брифу
          </button>
        </div>
      </div>
    </div>
  );
};
