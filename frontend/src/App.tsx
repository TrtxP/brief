import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Header } from './components/Header';
import { BriefFormPage } from './pages/BriefFormPage';
import { BRIEF_QUESTIONS } from './data/briefQuestions';
import { api } from './services/api';

// Lazy load admin pages to keep the public bundle lean
const AdminLoginPage = React.lazy(() =>
  import('./pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = React.lazy(() =>
  import('./pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage }))
);

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
    const saved = localStorage.getItem('brief_theme') as 'dark' | 'light' | null;
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
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

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleRouteChange = useCallback((route: RouteType) => {
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
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setCurrentRoute('admin');
    window.location.hash = 'admin';
  }, []);

  const handleLogout = useCallback(async () => {
    await api.adminLogout();
    setCurrentRoute('admin-login');
  }, []);

  const handleSavedChange = useCallback((count: number, time: string | null) => {
    setAnsweredCount(count);
    setLastSavedTime(time);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Header
        answeredCount={answeredCount}
        totalCount={BRIEF_QUESTIONS.length}
        lastSavedTime={lastSavedTime}
        currentRoute={currentRoute}
        onRouteChange={handleRouteChange}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {currentRoute === 'brief' && (
          <BriefFormPage onSavedChange={handleSavedChange} />
        )}

        <Suspense fallback={
          <div className="container" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Завантаження панелі...
          </div>
        }>
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
        </Suspense>
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

