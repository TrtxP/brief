import React from "react";
import { Moon, Sun } from "lucide-react";

interface HeaderProps {
  answeredCount?: number;
  totalCount?: number;
  lastSavedTime?: string | null;
  isAdmin?: boolean;
  currentRoute: "brief" | "admin" | "admin-login";
  onRouteChange: (route: "brief" | "admin" | "admin-login") => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export const Header = React.memo<HeaderProps>(({
  answeredCount = 0,
  totalCount = 28,
  currentRoute,
  onRouteChange,
  theme,
  onToggleTheme,
}) => {
  const percent =
    totalCount > 0
      ? Math.min(100, Math.round((answeredCount / totalCount) * 100))
      : 0;

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        {/* Text-First Brand Wordmark */}
        <div
          onClick={() => onRouteChange("brief")}
          className="brand-text"
          title="На головну сторінку брифу"
        >
          <span className="brand-title">AnglerBrief</span>
          <span className="brand-sub">
            {currentRoute.startsWith("admin")
              ? "Панель адміністратора"
              : "Опитувальник"}
          </span>
        </div>

        {/* Progress & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {currentRoute === "brief" && (
            <div className="header-progress-text">
              <span className="header-progress-pct">Заповнено {percent}%</span>
              <span style={{ marginLeft: "6px" }}>
                ({answeredCount}/{totalCount})
              </span>
            </div>
          )}

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="btn btn-secondary btn-sm"
            style={{ width: "32px", height: "32px", padding: 0 }}
            title={
              theme === "dark"
                ? "Увімкнути світлу тему"
                : "Увімкнути темну тему"
            }
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Navigation Button */}
          {currentRoute === "brief" && (
            <button
              type="button"
              onClick={() => onRouteChange("admin")}
              className="btn btn-secondary btn-sm"
            >
              <span>Адмін-панель</span>
            </button>
          )}

          {currentRoute === "admin" && (
            <button
              type="button"
              onClick={() => {
                window.location.hash = "";
              }}
              className="btn btn-primary btn-sm"
              title="Перейти до публічного брифу"
            >
              <span>До брифу</span>
            </button>
          )}
        </div>
      </div>

      {/* 2px Progress line along the bottom edge of sticky header */}
      {currentRoute === "brief" && (
        <div
          className="site-header-progress-line"
          style={{ width: `${percent}%` }}
        />
      )}
    </header>
  );
});

