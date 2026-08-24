'use client';

import { useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';

const LANGUAGE = 'cpp';

export default function MonacoCodeEditor({ code = '', setCode, language = LANGUAGE, setLanguage, readOnly = false, height = '100%' }) {
  const editorRef = useRef(null);
  const selectedLanguage = language === LANGUAGE ? LANGUAGE : LANGUAGE;

  useEffect(() => {
    if (setLanguage && language !== LANGUAGE) setLanguage(LANGUAGE);
  }, [language, setLanguage]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-3">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">C++</span>
        <span className="text-xs text-slate-500">Ctrl/Cmd + S to save locally</span>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height={height}
          language={selectedLanguage}
          value={code}
          theme="vs-dark"
          onMount={(editor) => { editorRef.current = editor; }}
          onChange={(value) => setCode?.(value ?? '')}
          options={{
            readOnly,
            minimap: { enabled: false },
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: 'Fira Code, Consolas, monospace',
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            padding: { top: 12, bottom: 12 },
            renderWhitespace: 'selection',
            smoothScrolling: true,
          }}
          wrapperProps={{ className: 'h-full w-full' }}
        />
      </div>
    </div>
  );
}
