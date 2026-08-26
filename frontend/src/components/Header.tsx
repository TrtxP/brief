import React from 'react';
import { Compass, Shield, CheckCircle2, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  answeredCount?: number;
  totalCount?: number;
  lastSavedTime?: string | null;
  isAdmin?: boolean;
  currentRoute: 'brief' | 'admin' | 'admin-login';
  onRouteChange: (route: 'brief' | 'admin' | 'admin-login') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  answeredCount = 0,
  totalCount = 34,
  lastSavedTime,
  isAdmin = false,
  currentRoute,
  onRouteChange,
  theme,
  onToggleTheme
}) => {
  const percent = totalCount > 0 ? Math.min(100, Math.round((answeredCount / totalCount) * 100)) : 0;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      background: theme === 'dark' ? 'rgba(11, 17, 32, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'all 0.2s ease'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
        {/* Brand */}
        <div
          onClick={() => onRouteChange('brief')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
          }}>
            <Compass size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
              Angler<span style={{ color: 'var(--accent-cyan-light)' }}>Brief</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {currentRoute.startsWith('admin') ? 'Панель адміністратора' : 'Бриф інтернет-магазину риболовлі'}
            </div>
          </div>
        </div>

        {/* Progress & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {currentRoute === 'brief' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '8px' }}>
              <div style={{ textAlign: 'right', display: 'none', minWidth: '110px' }} className="desktop-progress">
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Заповнено {percent}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {answeredCount} з {totalCount} питань
                </div>
              </div>
              <div style={{ width: '80px', display: 'none' }} className="desktop-progress">
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
              {lastSavedTime && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  color: 'var(--accent-emerald)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '20px'
                }}>
                  <CheckCircle2 size={13} />
                  <span>Автозбережено</span>
                </div>
              )}
            </div>
          )}

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="btn btn-secondary btn-sm"
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%' }}
            title={theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Admin Navigation Button */}
          {currentRoute === 'brief' ? (
            <button
              onClick={() => onRouteChange('admin')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Shield size={15} style={{ color: 'var(--accent-cyan)' }} />
              <span>Адмін-панель</span>
            </button>
          ) : (
            <button
              onClick={() => onRouteChange('brief')}
              className="btn btn-primary btn-sm"
            >
              До брифу
            </button>
          )}
        </div>
      </div>
      <style>{`
        @media (min-width: 640px) {
          .desktop-progress { display: block !important; }
        }
      `}</style>
    </header>
  );
};
