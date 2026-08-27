import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BriefFormPage } from './pages/BriefFormPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { api } from './services/api';

type RouteType = 'brief' | 'admin' | 'admin-login';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<RouteType>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (hash === '#admin' || hash === '#/admin' || path.endsWith('/admin')) {
      return api.hasToken() ? 'admin' : 'admin-login';
    }
    return 'brief';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('brief_theme') as 'dark' | 'light') || 'dark';
  });

  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Apply theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('brief_theme', theme);
  }, [theme]);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin' || hash === '#/admin') {
        setCurrentRoute(api.hasToken() ? 'admin' : 'admin-login');
      } else if (hash === '' || hash === '#/' || hash === '#brief') {
        setCurrentRoute('brief');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleRouteChange = (route: RouteType) => {
    if (route === 'admin') {
      if (api.hasToken()) {
        setCurrentRoute('admin');
        window.location.hash = 'admin';
      } else {
        setCurrentRoute('admin-login');
        window.location.hash = 'admin';
      }
    } else if (route === 'brief') {
      setCurrentRoute('brief');
      window.location.hash = '';
    } else {
      setCurrentRoute(route);
    }
  };

  const handleLoginSuccess = () => {
    setCurrentRoute('admin');
    window.location.hash = 'admin';
  };

  const handleLogout = async () => {
    await api.adminLogout();
    setCurrentRoute('admin-login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Header
        answeredCount={answeredCount}
        totalCount={34}
        lastSavedTime={lastSavedTime}
        currentRoute={currentRoute}
        onRouteChange={handleRouteChange}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {currentRoute === 'brief' && (
          <BriefFormPage
            onSavedChange={(count, time) => {
              setAnsweredCount(count);
              setLastSavedTime(time);
            }}
          />
        )}

        {currentRoute === 'admin-login' && (
          <AdminLoginPage
            onLoginSuccess={handleLoginSuccess}
            onBackToBrief={() => handleRouteChange('brief')}
          />
        )}

        {currentRoute === 'admin' && (
          <AdminDashboardPage
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px 0',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--text-muted)'
      }}>
        <div className="container">
          © {new Date().getFullYear()} Структурований бриф інтернет-магазину риболовлі. Усі права захищено.
        </div>
      </footer>
    </div>
  );
}
export default App;
