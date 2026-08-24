'use client';

import { useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';

const SUPPORTED_LANGUAGES = Object.freeze({ cpp: 'C++' });
const DEFAULT_LANGUAGE = 'cpp';

export default function MonacoCodeEditor({
  code = '',
  setCode,
  language = DEFAULT_LANGUAGE,
  setLanguage,
  readOnly = false,
  height = '100%',
}) {
  const editorRef = useRef(null);
  const selectedLanguage = Object.prototype.hasOwnProperty.call(SUPPORTED_LANGUAGES, language)
    ? language
    : DEFAULT_LANGUAGE;

  useEffect(() => {
    if (setLanguage && language !== DEFAULT_LANGUAGE) {
      setLanguage(DEFAULT_LANGUAGE);
    }
  }, [language, setLanguage]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
      <div className="flex min-h-10 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-300">Language</span>
          <span className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200">
            {SUPPORTED_LANGUAGES[selectedLanguage]}
          </span>
        </div>
        <span className="hidden text-xs text-slate-500 sm:inline">C++17</span>
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
