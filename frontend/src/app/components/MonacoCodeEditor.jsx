'use client'; // This component must be a Client Component

import { useState, useRef, useEffect } from 'react';
import { Editor, useMonaco } from '@monaco-editor/react';

// You can define a map for display names of languages if needed
const languageMap = {
  cpp: 'cpp', // Monaco uses 'cpp' directly for C++
  python: 'python',
  javascript: 'javascript',
  // Add other languages as needed, ensuring they match Monaco's language IDs
  java: 'java',
  typescript: 'typescript',
  html: 'html',
  css: 'css',
  json: 'json'
};

export default function MonacoCodeEditor({
  code,
  setCode,
  language = 'cpp', // Default language
  setLanguage, // Optional: if you want a language selector inside
  readOnly = false,
  // height = '600', // Default height
}) {
  const editorRef = useRef(null);
  const monaco = useMonaco(); // Hook to access the monaco instance

  const [currentLanguage, setCurrentLanguage] = useState(language);

  // Update internal language state if prop changes
  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    // You can perform additional setup here if needed
    // For example, adding custom commands or actions
  }

  function handleEditorChange(value, event) {
    // value is the current content of the editor
    setCode?.(value); // Only call setCode if it's provided
  }

  // Optional: Function to handle language change if you have a selector
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setCurrentLanguage(newLang);
    setLanguage?.(newLang); // If setLanguage prop is provided
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden relative">
      {/* Optional: Language selector */}
      {!readOnly && setLanguage && ( // Only show if not readOnly and setLanguage prop is provided
        <div className="bg-gray-800 text-white p-2 flex justify-end">
          <select
            value={currentLanguage}
            onChange={handleLanguageChange}
            className="bg-gray-700 text-sm px-2 py-1 rounded focus:outline-none"
          >
            {Object.entries(languageMap).map(([key, label]) => (
              <option key={key} value={key}>
                {label.charAt(0).toUpperCase() + label.slice(1)} {/* Capitalize display name */}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-gray-900 text-white font-mono text-sm" style={{ height: 800 }}>
        <Editor
          height="100%" // Editor takes 100% of its parent div's height
          language={currentLanguage}
          defaultValue={code} // Use defaultValue for initial value
          value={code} // Use value for controlled component, so changes are reflected
          theme="vs-dark" // Or 'light', 'hc-black'
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          options={{
            readOnly: readOnly,
            minimap: { enabled: false }, // Disable minimap for cleaner look
            lineNumbers: 'on', // Show line numbers
            wordWrap: 'on', // Wrap long lines
            scrollBeyondLastLine: false, // Don't allow scrolling past the last line
            fontSize: 14,
            fontFamily: '"Fira Code", monospace', // Use your preferred font
            automaticLayout: true, // Automatically resize editor when container changes
            // You can add many more options here: https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IEditorOptions.html
          }}
          // The `wrapperProps` are passed to the wrapper div around the editor
          // You could potentially add Tailwind classes here if needed.
          wrapperProps={{
            className: 'w-full h-full'
          }}
        />
      </div>
    </div>
  );
}