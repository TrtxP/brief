import React, { useState, useEffect, useCallback } from 'react';
import { SubmissionItem, AdminStats, SubmissionStatus } from '../types/admin';
import { AdminEditModal } from './AdminEditModal';
import { api } from '../services/api';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Search, 
  Download, 
  LogOut, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  AlertCircle,
  Filter,
  DollarSign
} from 'lucide-react';

interface AdminDashboardPageProps {
  onLogout: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onLogout }) => {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Active editing submission modal
  const [editingSubmission, setEditingSubmission] = useState<SubmissionItem | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminGetSubmissions({
        status: statusFilter,
        search: searchTerm,
        page: page,
        per_page: 15
      });
      setSubmissions(res.data.submissions);
      setStats(res.data.stats);
      setTotalPages(res.data.pagination.total_pages);
    } catch (err: any) {
      setError(err.message || 'Не вдалося завантажити дані.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, page]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Quick status update
  const handleStatusChange = async (id: number, newStatus: SubmissionStatus) => {
    try {
      await api.adminUpdateStatus(id, newStatus);
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      // Refresh stats
      const res = await api.adminGetSubmissions({ page });
      setStats(res.data.stats);
    } catch (err: any) {
      alert('Помилка оновлення статусу: ' + err.message);
    }
  };

  // Delete submission
  const handleDelete = async (id: number, refCode: string) => {
    if (window.confirm(`Ви впевнені, що хочете видалити бриф ${refCode}?`)) {
      try {
        await api.adminDeleteSubmission(id);
        fetchSubmissions();
      } catch (err: any) {
        alert('Помилка видалення: ' + err.message);
      }
    }
  };

  // Open edit modal for full answers editing
  const handleOpenEdit = async (item: SubmissionItem) => {
    try {
      // Fetch full details if needed
      const full = await api.adminGetSubmission(item.id);
      setEditingSubmission(full.data);
    } catch {
      setEditingSubmission(item);
    }
  };

  const handleUpdatedSubmission = (updated: SubmissionItem) => {
    setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s));
    setEditingSubmission(updated);
  };

  const statusLabel = (st: SubmissionStatus) => {
    switch (st) {
      case 'new': return 'Новий';
      case 'in_review': return 'В обробці';
      case 'approved': return 'Погоджено';
      case 'rejected': return 'Відхилено';
      case 'completed': return 'Завершено';
      default: return st;
    }
  };

  return (
    <div className="container" style={{ paddingTop: '28px', paddingBottom: '80px' }}>
      {/* Top Bar: Title & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Панель керування брифами
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Перегляд заявок, детальна аналітика та повне редагування зафіксованих відповідей
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Export Dropdown / Buttons */}
          <a
            href={api.getExportUrl('csv')}
            className="btn btn-secondary btn-sm"
            target="_blank"
            rel="noreferrer"
            title="Завантажити у форматі CSV для Excel"
          >
            <Download size={14} />
            <span>Експорт CSV</span>
          </a>

          <a
            href={api.getExportUrl('json')}
            className="btn btn-secondary btn-sm"
            target="_blank"
            rel="noreferrer"
            title="Завантажити у форматі JSON"
          >
            <Download size={14} />
            <span>Експорт JSON</span>
          </a>

          <button
            onClick={() => fetchSubmissions()}
            className="btn btn-secondary btn-sm"
            title="Оновити список"
          >
            <RefreshCw size={14} className={loading ? 'pulse-glow' : ''} />
          </button>

          <button
            onClick={onLogout}
            className="btn btn-danger btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} />
            <span>Вийти</span>
          </button>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Всього брифів</span>
              <FileText size={18} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {stats.total}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid var(--accent-cyan-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Нові заявки</span>
              <span className="badge badge-new" style={{ fontSize: '10px' }}>NEW</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {stats.by_status.new || 0}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid var(--accent-amber)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>В обробці</span>
              <Clock size={18} style={{ color: 'var(--accent-amber)' }} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
              {stats.by_status.in_review || 0}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid var(--accent-emerald)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Погоджено / Готово</span>
              <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {(stats.by_status.approved || 0) + (stats.by_status.completed || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Всі' },
              { id: 'new', label: 'Нові' },
              { id: 'in_review', label: 'В обробці' },
              { id: 'approved', label: 'Погоджено' },
              { id: 'completed', label: 'Завершено' },
              { id: 'rejected', label: 'Відхилено' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                className="btn btn-sm"
                style={{
                  background: statusFilter === tab.id ? 'var(--accent-cyan)' : 'var(--bg-surface-elevated)',
                  color: statusFilter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '38px', paddingBottom: '8px', paddingTop: '8px', fontSize: '13px' }}
              placeholder="Пошук за клієнтом, телефоном, кодом..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Submissions List Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="pulse-glow" style={{ margin: '0 auto 12px auto' }} />
            <div>Завантаження списку брифів...</div>
          </div>
        ) : submissions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Записів не знайдено
            </div>
            <div style={{ fontSize: '13px' }}>
              За вибраними критеріями фільтрації немає збережених брифів.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-secondary)' }}>Код брифу</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-secondary)' }}>Клієнт та Контакти</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-secondary)' }}>Магазин / Бюджет</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-secondary)' }}>Статус</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-secondary)' }}>Дата</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>Дії</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(item => (
                  <tr 
                    key={item.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                    className="hover-row"
                  >
                    {/* Ref Code */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '12px',
                        color: 'var(--accent-cyan-light)',
                        background: 'rgba(2, 132, 199, 0.12)',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}>
                        {item.reference_code}
                      </span>
                    </td>

                    {/* Client & Phone */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.client_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {item.phone} {item.contact_method ? `• ${item.contact_method}` : ''}
                      </div>
                    </td>

                    {/* Store & Budget */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <div style={{ color: 'var(--text-primary)' }}>
                        {item.store_name || 'Не вказано'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--accent-amber)' }}>
                        {item.budget || 'Бюджет не вибрано'}
                      </div>
                    </td>

                    {/* Status Changer */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                      <select
                        className="select"
                        value={item.status}
                        onChange={e => handleStatusChange(item.id, e.target.value as SubmissionStatus)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '16px',
                          background: item.status === 'new' ? 'rgba(56, 189, 248, 0.15)' :
                                      item.status === 'in_review' ? 'rgba(245, 158, 11, 0.15)' :
                                      item.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' :
                                      item.status === 'completed' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                          color: item.status === 'new' ? '#38bdf8' :
                                 item.status === 'in_review' ? '#fbbf24' :
                                 item.status === 'approved' ? '#34d399' :
                                 item.status === 'completed' ? '#c084fc' : '#fb7185',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="new">Новий</option>
                        <option value="in_review">В обробці</option>
                        <option value="approved">Погоджено</option>
                        <option value="rejected">Відхилено</option>
                        <option value="completed">Завершено</option>
                      </select>
                    </td>

                    {/* Created Date */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.created_at}
                    </td>

                    {/* Action Buttons */}
                    <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                          title="Редагувати відповіді брифу"
                        >
                          <Edit3 size={13} />
                          <span>Редагувати</span>
                        </button>

                        <button
                          onClick={() => handleDelete(item.id, item.reference_code)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '6px 10px' }}
                          title="Видалити"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Сторінка {page} з {totalPages}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="btn btn-secondary btn-sm"
              >
                Попередня
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="btn btn-secondary btn-sm"
              >
                Наступна
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Edit Modal */}
      {editingSubmission && (
        <AdminEditModal
          submission={editingSubmission}
          onClose={() => {
            setEditingSubmission(null);
            fetchSubmissions();
          }}
          onUpdated={handleUpdatedSubmission}
        />
      )}

      <style>{`
        .hover-row:hover {
          background: rgba(2, 132, 199, 0.05);
        }
      `}</style>
    </div>
  );
};
