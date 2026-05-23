import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Plus, Trash2, FileText, AlertCircle, X } from 'lucide-react';
import api from '../api/axios';

/*
  NotesPanel — NO auto-save.
  "+" creates a local draft instantly (no DB call).
  Toolbar "Save" button calls getCurrentNote() → parent handles the API call → calls onNoteSaved(result).
  Same title in DB → update. New title → create. Never duplicates.
*/
const NotesPanel = forwardRef(function NotesPanel(_, ref) {
  const [notes,       setNotes]       = useState([]);
  const [activeNote,  setActiveNote]  = useState(null);
  const [title,       setTitle]       = useState('');
  const [content,     setContent]     = useState('');
  const [dbError,     setDbError]     = useState(false);
  const [unsaved,     setUnsaved]     = useState(false);
  const [isDraft,     setIsDraft]     = useState(false);

  const activeRef   = useRef(null);
  const titleRef    = useRef('');
  const contentRef  = useRef('');
  const notesRef    = useRef([]);
  const isDraftRef  = useRef(false);  // mirrors isDraft state synchronously

  const syncRefs = (patch = {}) => {
    if ('activeNote' in patch) { activeRef.current  = patch.activeNote; }
    if ('title'      in patch) { titleRef.current   = patch.title;      }
    if ('content'    in patch) { contentRef.current = patch.content;    }
    if ('isDraft'    in patch) { isDraftRef.current = patch.isDraft;    }
  };

  useEffect(() => { notesRef.current = notes; }, [notes]);

  useImperativeHandle(ref, () => ({
    getCurrentNote: () => ({
      id:      isDraftRef.current ? null : activeRef.current,
      title:   titleRef.current  || 'New Note',
      content: contentRef.current,
      isDraft: isDraftRef.current,
    }),
    // Called by HomePage after API save succeeds — updates local list + clears draft flag
    onNoteSaved: (savedNote) => {
      const id = savedNote._id || savedNote.id;
      setIsDraft(false);       isDraftRef.current = false;
      setActiveNote(id);       activeRef.current  = id;
      setUnsaved(false);
      setNotes(prev => {
        const exists = prev.find(n => (n._id || n.id) === id);
        return exists
          ? prev.map(n => ((n._id || n.id) === id ? savedNote : n))
          : [savedNote, ...prev];
      });
    },
    markSaved:    () => setUnsaved(false),
    openNote: (note) => {
      selectNote(note);
    },
    getExportText: () => {
      const t = titleRef.current;
      const c = contentRef.current;
      return (t ? t + '\n' + '='.repeat(t.length) + '\n\n' : '') + c;
    },
    reloadNotes: loadNotes,
  }));

  useEffect(() => {
    loadNotes();
    window.__devpadNotesExport = () => {
      const t = titleRef.current;
      const c = contentRef.current;
      return (t ? t + '\n' + '='.repeat(t.length) + '\n\n' : '') + c;
    };
    return () => { delete window.__devpadNotesExport; };
  }, []);

  async function loadNotes() {
    try {
      const res = await api.get('/notes');
      const data = res.data || [];
      setNotes(data);
      setDbError(false);
      if (data.length > 0) selectNote(data[0]);
    } catch (err) {
      console.error('Failed to load notes:', err.message);
      setDbError(true);
    }
  }

  const selectNote = (note) => {
    const id = note._id || note.id;
    setActiveNote(id);  syncRefs({ activeNote: id });
    setTitle(note.title   || '');  syncRefs({ title:   note.title   || '' });
    setContent(note.content || ''); syncRefs({ content: note.content || '' });
    setUnsaved(false);
    setIsDraft(false);  syncRefs({ isDraft: false });
  };

  const createDraft = () => {
    setActiveNote('__draft__'); syncRefs({ activeNote: '__draft__' });
    setTitle('New Note');       syncRefs({ title: 'New Note' });
    setContent('');             syncRefs({ content: '' });
    setUnsaved(true);
    setIsDraft(true);           syncRefs({ isDraft: true });
  };

  const deleteNote = async (id) => {
    const remaining = notesRef.current.filter(n => n._id !== id && n.id !== id);
    setNotes(remaining);
    try { await api.delete(`/notes/${id}`); setDbError(false); }
    catch (err) { console.error('Delete failed:', err.message); setDbError(true); }
    if (activeRef.current === id) {
      if (remaining.length > 0) selectNote(remaining[0]);
      else {
        setActiveNote(null); syncRefs({ activeNote: null });
        setTitle('');        syncRefs({ title: '' });
        setContent('');      syncRefs({ content: '' });
        setIsDraft(false);   syncRefs({ isDraft: false });
        setUnsaved(false);
      }
    }
  };

  const handleTitleChange = (v) => {
    setTitle(v); syncRefs({ title: v }); setUnsaved(true);
  };
  const handleContentChange = (v) => {
    setContent(v); syncRefs({ content: v }); setUnsaved(true);
  };

  const isEditing = activeNote !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-card)' }}>

      {/* DB error */}
      {dbError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: '#ef4444', fontFamily: 'Space Grotesk, sans-serif', flexShrink: 0 }}>
          <AlertCircle size={13} /> Cannot reach database. Check your server.
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={15} style={{ color: '#a855f7' }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Notes</span>
          {unsaved && isEditing && (
            <span
              title={isDraft ? 'New draft — click Save to persist' : 'Unsaved changes — click Save'}
              style={{ width: 7, height: 7, borderRadius: '50%', background: isDraft ? '#a855f7' : '#f59e0b', display: 'inline-block', flexShrink: 0 }}
            />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isEditing && (
            <button
              onClick={() => { setActiveNote(null); syncRefs({ activeNote: null }); setTitle(''); syncRefs({ title: '' }); setContent(''); syncRefs({ content: '' }); setIsDraft(false); syncRefs({ isDraft: false }); setUnsaved(false); }}
              title="Close note"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 5, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            ><X size={13} /></button>
          )}
          <button
            onClick={createDraft}
            title="New note (click Save to persist)"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,85,247,0.15)'}
          ><Plus size={14} /></button>
        </div>
      </div>

      {/* Note Tabs */}
      {(notes.length > 0 || isDraft) && (
        <div style={{ padding: '8px 8px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 4, flexWrap: 'wrap', flexShrink: 0, maxHeight: 80, overflowY: 'auto' }}>
          {isDraft && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 12, background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#a855f7', maxWidth: 150 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{title || 'New Note'}</span>
              <span title="Unsaved draft" style={{ fontSize: 9 }}>●</span>
            </div>
          )}
          {notes.map(note => {
            const id = note._id || note.id;
            const isActive = !isDraft && activeNote === id;
            return (
              <div key={id} onClick={() => selectNote(note)} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6,
                cursor: 'pointer', fontSize: 12, transition: 'all 0.15s', maxWidth: 150,
                background: isActive ? 'rgba(168,85,247,0.2)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(168,85,247,0.4)' : 'transparent'}`,
                color: isActive ? '#a855f7' : 'var(--text-muted)',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{note.title || 'Untitled'}</span>
                <button
                  onClick={e => { e.stopPropagation(); selectNote(note); setActiveNote(null); syncRefs({ activeNote: null }); setTitle(''); syncRefs({ title: '' }); setContent(''); syncRefs({ content: '' }); setIsDraft(false); syncRefs({ isDraft: false }); setUnsaved(false); }}
                  title="Close note"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0, opacity: 0.7 }}
                ><X size={10} /></button>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor */}
      {isEditing ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <input
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Note title…"
            style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, outline: 'none', flexShrink: 0 }}
          />
          <textarea
            value={content}
            onChange={e => handleContentChange(e.target.value)}
            placeholder={'Start writing…\n\nClick Save in the toolbar to save to database.'}
            style={{ flex: 1, padding: 16, background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, lineHeight: 1.7, outline: 'none', resize: 'none' }}
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
          <FileText size={32} style={{ opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>No notes yet</p>
          <button onClick={createDraft} style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: '#a855f7', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={13} /> New Note
          </button>
        </div>
      )}

      {isEditing && (
        <div style={{ padding: '6px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, display: 'flex', gap: 12 }}>
          <span>{content.length} chars</span>
          {isDraft && <span style={{ color: '#a855f7' }}>New — not saved yet</span>}
          {!isDraft && unsaved && <span style={{ color: '#f59e0b' }}>Unsaved changes</span>}
        </div>
      )}
    </div>
  );
});

export default NotesPanel;
