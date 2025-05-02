// This is a simplified syntax highlighter module
import React from 'react';

// Define a basic style for the syntax highlighter
export const oneDark = {
  backgroundColor: '#282c34',
  color: '#abb2bf',
  padding: '1rem',
  borderRadius: '0.375rem',
  border: '1px solid rgb(38, 38, 38)',
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  lineHeight: '1.5rem',
  overflowX: 'auto',
};

// Define a simple syntax highlighter component
export const SyntaxHighlighter: React.FC<{
  language?: string;
  style?: any;
  children: string;
  showLineNumbers?: boolean;
  wrapLines?: boolean;
  lineNumberStyle?: any;
  customStyle?: any;
}> = ({
  language,
  style = oneDark,
  children,
  showLineNumbers = false,
  customStyle = {},
}) => {
  // Format the code by adding line numbers if needed
  const formatCode = () => {
    if (!children) return '';
    
    const lines = children.split('\n');
    
    if (showLineNumbers) {
      return lines.map((line, i) => (
        <div key={i} className="syntax-line">
          <span className="line-number" style={{ color: '#4B5563', marginRight: '1em', display: 'inline-block', minWidth: '2.5em', textAlign: 'right' }}>
            {i + 1}
          </span>
          <span className="line-content">{line}</span>
        </div>
      ));
    }
    
    return children;
  };

  return (
    <pre style={{ ...style, ...customStyle }}>
      <code>
        {formatCode()}
      </code>
    </pre>
  );
};
