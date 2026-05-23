import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';

const LANG_EXTENSIONS = {
  javascript: javascript({ jsx: true }),
  python: python(),
  cpp: cpp(),
  java: java(),
};

const lightTheme = EditorView.theme({
  '&': { background: 'transparent', color: '#1a1a2e' },
  '.cm-content': { caretColor: '#a855f7' },
  '&.cm-focused .cm-cursor': { borderLeftColor: '#a855f7' },
  '.cm-selectionBackground, ::selection': { background: 'rgba(168,85,247,0.2) !important' },
  '.cm-activeLine': { background: 'rgba(168,85,247,0.05)' },
  '.cm-gutters': { background: 'rgba(240,240,250,0.5)', color: '#9999bb', border: 'none' },
  '.cm-activeLineGutter': { background: 'rgba(168,85,247,0.1)' },
}, { dark: false });

const darkTheme = EditorView.theme({
  '&': { background: 'transparent', color: '#e8e8f0' },
  '.cm-content': { caretColor: '#00d4ff' },
  '&.cm-focused .cm-cursor': { borderLeftColor: '#00d4ff' },
  '.cm-selectionBackground, ::selection': { background: 'rgba(0,212,255,0.15) !important' },
  '.cm-activeLine': { background: 'rgba(0,212,255,0.04)' },
  '.cm-gutters': { background: 'rgba(10,10,20,0.6)', color: '#444466', border: 'none' },
  '.cm-activeLineGutter': { background: 'rgba(0,212,255,0.08)' },
}, { dark: true });

// ── Simple formatter: normalise indentation & trailing spaces ───────────
function formatCode(code, language) {
  const lines = code.split('\n');
  const formatted = [];
  let indent = 0;
  const TAB = '  '; // 2 spaces

  // Language-specific open/close chars
  const isJava  = language === 'java';
  const isCpp   = language === 'cpp';
  const isJS    = language === 'javascript';
  const isPy    = language === 'python';

  if (isPy) {
    // Python: normalise existing indentation to 4 spaces per level
    for (let line of lines) {
      const trimmed = line.trimEnd();
      if (!trimmed) { formatted.push(''); continue; }
      const leading = line.length - line.trimStart().length;
      // Snap to 4-space multiples
      const level = Math.round(leading / 4);
      formatted.push('    '.repeat(level) + trimmed.trimStart());
    }
    return formatted.join('\n');
  }

  // For C-style / Java / JS: use brace matching
  for (let raw of lines) {
    const line = raw.trim();
    if (!line) { formatted.push(''); continue; }

    // Dedent closing braces before writing
    if (line.startsWith('}') || line.startsWith(')') || line.startsWith(']')) {
      indent = Math.max(0, indent - 1);
    }

    formatted.push(TAB.repeat(indent) + line);

    // Count net open braces to decide next line indent
    let opens = 0, closes = 0;
    let inStr = false, strChar = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inStr) {
        if (c === strChar && line[i - 1] !== '\\') inStr = false;
      } else if (c === '"' || c === "'" || c === '`') {
        inStr = true; strChar = c;
      } else if (c === '{' || c === '(' || c === '[') opens++;
      else if (c === '}' || c === ')' || c === ']') closes++;
    }
    indent = Math.max(0, indent + opens - closes);
    // Handle lines ending with opening brace already counted
    if (line.endsWith('{') || line.endsWith('(') || line.endsWith('[')) {
      // already handled above
    }
  }
  return formatted.join('\n');
}

const CodeEditor = forwardRef(function CodeEditor({ code, language, onChange, isDark }, ref) {
  const editorRef = useRef(null);
  const viewRef   = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Expose formatCode to parent via ref
  useImperativeHandle(ref, () => ({
    format: () => {
      const view = viewRef.current;
      if (!view) return;
      const current = view.state.doc.toString();
      const pretty  = formatCode(current, language);
      if (pretty === current) return;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: pretty },
        selection: { anchor: 0 },
      });
      onChangeRef.current(pretty);
    }
  }));

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        LANG_EXTENSIONS[language] || javascript(),
        isDark ? oneDark : lightTheme,
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    return () => { view.destroy(); viewRef.current = null; };
  }, [language, isDark]);

  // Sync external code changes (e.g. loading saved snippet) without recreating
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== code) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: code } });
    }
  }, [code]);

  return <div ref={editorRef} style={{ height: '100%', overflow: 'hidden' }} />;
});

export default CodeEditor;
