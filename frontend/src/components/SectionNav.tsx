import React from 'react';
import { Section } from '../types/brief';
import { UserCheck, Building2, Users, Layers, Palette, Clock, Check } from 'lucide-react';

interface SectionNavProps {
  sections: Section[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
  sectionCompletion: Record<string, { answered: number; total: number }>;
}

const iconMap: Record<string, React.ReactNode> = {
  UserCheck: <UserCheck size={16} />,
  Building2: <Building2 size={16} />,
  Users: <Users size={16} />,
  Layers: <Layers size={16} />,
  Palette: <Palette size={16} />,
  Clock: <Clock size={16} />
};

export const SectionNav: React.FC<SectionNavProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
  sectionCompletion
}) => {
  return (
    <aside style={{
      position: 'sticky',
      top: '90px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: 'var(--text-muted)',
        marginBottom: '4px',
        paddingLeft: '8px'
      }}>
        Розділи брифу
      </div>

      {sections.map((section, idx) => {
        const isActive = activeSectionId === section.id;
        const comp = sectionCompletion[section.id] || { answered: 0, total: section.questionIds.length };
        const isCompleted = comp.answered >= comp.total && comp.total > 0;

        return (
          <button
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: isActive 
                ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.2) 0%, rgba(2, 132, 199, 0.05) 100%)' 
                : 'var(--bg-card)',
              border: isActive 
                ? '1px solid var(--accent-cyan)' 
                : '1px solid var(--border-subtle)',
              color: isActive ? 'var(--text-accent)' : 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              outline: 'none',
              boxShadow: isActive ? '0 0 15px rgba(2, 132, 199, 0.2)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                color: isCompleted ? 'var(--accent-emerald)' : (isActive ? 'var(--accent-cyan-light)' : 'var(--text-muted)'),
                display: 'flex',
                alignItems: 'center'
              }}>
                {isCompleted ? <Check size={16} /> : (iconMap[section.iconName] || <Layers size={16} />)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {idx + 1}. {section.title}
                </div>
              </div>
            </div>

            {/* Badge counts */}
            <div style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '10px',
              background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-elevated)',
              color: isCompleted ? 'var(--accent-emerald)' : 'var(--text-muted)',
              fontWeight: 600,
              flexShrink: 0
            }}>
              {comp.answered}/{comp.total}
            </div>
          </button>
        );
      })}
    </aside>
  );
};
