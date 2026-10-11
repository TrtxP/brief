import React, { useState, useEffect, useCallback } from 'react';
import { SubmissionItem, AdminStats, SubmissionStatus } from '../types/admin';
import { AdminEditModal } from './AdminEditModal';
import { AdminViewModal } from './AdminViewModal';
import { api } from '../services/api';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Search, 
  Download, 
  LogOut, 
  Trash2, 
  Edit3, 
  Eye,
  RefreshCw, 
  Inbox
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
  // Active viewing submission modal
  const [viewingSubmission, setViewingSubmission] = useState<SubmissionItem | null>(null);

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

  // Open view modal for full brief inspection
  const handleOpenView = async (item: SubmissionItem) => {
    try {
      const full = await api.adminGetSubmission(item.id);
      setViewingSubmission(full.data);
    } catch {
      setViewingSubmission(item);
    }
  };

  const handleEditFromView = (item: SubmissionItem) => {
    setViewingSubmission(null);
    handleOpenEdit(item);
  };

  const handleDeleteFromView = async (id: number, refCode: string) => {
    if (window.confirm(`Ви впевнені, що хочете видалити бриф ${refCode}?`)) {
      try {
        await api.adminDeleteSubmission(id);
        setViewingSubmission(null);
        fetchSubmissions();
      } catch (err: any) {
        alert('Помилка видалення: ' + err.message);
      }
    }
  };

  // Open edit modal for full answers editing
  const handleOpenEdit = async (item: SubmissionItem) => {
    try {
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Панель керування брифами
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Перегляд заявок, статистика та редагування зафіксованих відповідей
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href={api.getExportUrl('csv')}
            className="btn btn-secondary btn-sm"
            target="_blank"
            rel="noreferrer"
            title="Завантажити у форматі CSV"
          >
            <Download size={13} />
            <span>CSV</span>
          </a>

          <a
            href={api.getExportUrl('json')}
            className="btn btn-secondary btn-sm"
            target="_blank"
            rel="noreferrer"
            title="Завантажити у форматі JSON"
          >
            <Download size={13} />
            <span>JSON</span>
          </a>

          <a
            href={api.getExportUrl('xlsx')}
            className="btn btn-secondary btn-sm"
            target="_blank"
            rel="noreferrer"
            title="Завантажити у форматі XLSX"
          >
            <Download size={13} />
            <span>XLSX</span>
          </a>

          <button
            type="button"
            onClick={() => fetchSubmissions()}
            className="btn btn-secondary btn-sm"
            title="Оновити список"
          >
            <RefreshCw size={13} />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--accent-rose)', borderColor: 'var(--border-subtle)' }}
          >
            <LogOut size={13} />
            <span>Вийти</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="action-error-banner" style={{ marginBottom: '20px' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Analytics Stats Grid */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Всього брифів</span>
              <FileText size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {stats.total}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Нові заявки</span>
              <span className="badge badge-new" style={{ fontSize: '10px' }}>NEW</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {stats.by_status.new || 0}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>В обробці</span>
              <Clock size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {stats.by_status.in_review || 0}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Погоджено / Готово</span>
              <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
              {(stats.by_status.approved || 0) + (stats.by_status.completed || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '14px 18px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
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
                type="button"
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                className="btn btn-sm"
                style={{
                  background: statusFilter === tab.id ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                  color: statusFilter === tab.id ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
                  borderColor: statusFilter === tab.id ? 'var(--accent-primary)' : 'var(--border-subtle)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px', flex: '1', maxWidth: '340px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '32px', paddingBottom: '6px', paddingTop: '6px', fontSize: '13px' }}
              placeholder="Пошук клієнта, телефону, коду..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Submissions List Table */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={20} style={{ margin: '0 auto 10px auto' }} />
            <div>Завантаження списку...</div>
          </div>
        ) : submissions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Inbox size={28} style={{ margin: '0 auto 10px auto', opacity: 0.6 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Записів не знайдено
            </div>
            <div style={{ fontSize: '13px' }}>
              За поточними критеріями фільтрації немає записів.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Код</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Клієнт / Контакт</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Магазин / Бюджет</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Статус</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Дата</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Дії</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(item => (
                  <tr 
                    key={item.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    {/* Ref Code */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '12px',
                        color: 'var(--accent-primary)',
                        background: 'var(--accent-primary-muted)',
                        padding: '3px 6px',
                        borderRadius: 'var(--radius-xs)'
                      }}>
                        {item.reference_code}
                      </span>
                    </td>

                    {/* Client & Phone */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.client_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {item.phone} {item.contact_method ? `• ${item.contact_method}` : ''}
                      </div>
                    </td>

                    {/* Store & Budget */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ color: 'var(--text-primary)' }}>
                        {item.store_name || '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {item.budget || '—'}
                      </div>
                    </td>

                    {/* Status Changer */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <select
                        className="select"
                        value={item.status}
                        onChange={e => handleStatusChange(item.id, e.target.value as SubmissionStatus)}
                        style={{
                          padding: '3px 8px',
                          fontSize: '12px',
                          fontWeight: 500,
                          borderRadius: 'var(--radius-xs)',
                          width: 'auto',
                          background: 'var(--bg-surface-elevated)'
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
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.created_at}
                    </td>

                    {/* Action Buttons */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenView(item)}
                          className="btn btn-secondary btn-sm"
                          title="Переглянути бриф"
                        >
                          <Eye size={13} />
                          <span>Перегляд</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="btn btn-primary btn-sm"
                          title="Редагувати"
                        >
                          <Edit3 size={13} />
                          <span>Редагувати</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.reference_code)}
                          className="btn btn-danger btn-sm"
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
            padding: '12px 18px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Сторінка {page} з {totalPages}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-secondary btn-sm"
              >
                &larr; Попередня
              </button>

              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-secondary btn-sm"
              >
                Наступна &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated View Modal */}
      {viewingSubmission && (
        <AdminViewModal
          submission={viewingSubmission}
          onClose={() => setViewingSubmission(null)}
          onEdit={handleEditFromView}
          onDelete={handleDeleteFromView}
        />
      )}

      {/* Dedicated Edit Modal */}
      {editingSubmission && (
        <AdminEditModal
          submission={editingSubmission}
          onClose={() => setEditingSubmission(null)}
          onUpdated={handleUpdatedSubmission}
        />
      )}
    </div>
  );
};
