import { useGameStore } from '../store';
import { useEffect, useState, useRef } from 'react';
import { X, Loader2, CheckCircle, Info } from 'lucide-react';

interface CommandResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandResponseModal({ isOpen, onClose }: CommandResponseModalProps) {
  const { currentCommand, commandResponse, isCommandLoading, setCommandResponse } = useGameStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const [responseText, setResponseText] = useState('');

  // Parse the response as it streams in
  useEffect(() => {
    if (!commandResponse) {
      setResponseText('');
      return;
    }

    try {
      // Try to parse as JSON (content_delta format from Claude)
      const data = JSON.parse(commandResponse);
      if (data.type === 'content_delta' && data.delta?.text) {
        // Extract text from the delta
        const text = typeof data.delta.text === 'string'
          ? data.delta.text
          : JSON.stringify(data.delta.text);
        setResponseText(prev => prev + text);
      } else if (typeof data === 'string') {
        setResponseText(commandResponse);
      }
    } catch {
      // Not JSON, treat as plain text
      setResponseText(commandResponse);
    }
  }, [commandResponse]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [responseText]);

  // Clear response when modal closes
  useEffect(() => {
    if (!isOpen) {
      setResponseText('');
      setCommandResponse('');
    }
  }, [isOpen, setCommandResponse]);

  if (!isOpen) return null;

  // Format the response text for display
  const formatResponse = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;
    let inTable = false;
    let tableRows: string[] = [];

    const renderTable = () => {
      if (tableRows.length < 2) return null;

      const header = tableRows[0];
      const dataRows = tableRows.slice(1);

      return (
        <div key={`table-${key++}`} className="my-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                {header.split('|').map((cell, i) => (
                  <th key={i} className="px-3 py-2 text-left text-zinc-400 font-medium">
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-zinc-800/50">
                  {row.split('|').map((cell, cellIdx) => (
                    <td key={cellIdx} className={`px-3 py-2 ${
                      cell.includes('**') ? 'text-green-400 font-medium' :
                      cell.includes('Cannot') ? 'text-red-400' : 'text-zinc-300'
                    }`}>
                      {cell.replace(/\*\*/g, '').trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Table row detection
      if (line.includes('|') && !line.startsWith('#')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(line);
        continue;
      } else if (inTable) {
        inTable = false;
        const table = renderTable();
        if (table) elements.push(table);
        tableRows = [];
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={key++} className="text-xl font-bold text-zinc-100 mt-4 mb-2">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="text-lg font-semibold text-zinc-200 mt-3 mb-2">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="text-md font-medium text-zinc-300 mt-3 mb-1">
            {line.replace('### ', '')}
          </h3>
        );
      }
      // Horizontal rule
      else if (line.startsWith('---')) {
        elements.push(<hr key={key++} className="my-4 border-zinc-800" />);
      }
      // Bullet points
      else if (line.startsWith('- ')) {
        elements.push(
          <li key={key++} className="ml-4 text-zinc-300 leading-relaxed">
            {formatInlineStyles(line.replace('- ', ''))}
          </li>
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^\d+/)?.[0];
        elements.push(
          <div key={key++} className="ml-4 flex gap-2 text-zinc-300 leading-relaxed">
            <span className="text-zinc-500">{num}.</span>
            <span>{formatInlineStyles(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
      }
      // Blockquote/important info
      else if (line.startsWith('> ')) {
        elements.push(
          <div key={key++} className="my-2 p-3 bg-blue-500/10 border-l-2 border-blue-500 rounded-r">
            <p className="text-blue-200 text-sm">{line.replace('> ', '')}</p>
          </div>
        );
      }
      // Empty line
      else if (line.trim() === '') {
        elements.push(<div key={key++} className="h-2" />);
      }
      // Regular text
      else {
        elements.push(
          <p key={key++} className="text-zinc-300 leading-relaxed">
            {formatInlineStyles(line)}
          </p>
        );
      }
    }

    // Render any remaining table
    if (inTable && tableRows.length > 0) {
      const table = renderTable();
      if (table) elements.push(table);
    }

    return elements;
  };

  // Format inline markdown styles (bold, italic)
  const formatInlineStyles = (text: string): React.ReactNode => {
    // Handle bold text
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="font-bold text-zinc-100">{part.slice(2, -2)}</span>;
      }
      return part;
    });
  };

  // Extract options/choices from the response
  const extractOptions = (text: string) => {
    const options: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Match patterns like "1. **Option**" or "- **Option**"
      const match = line.match(/^(?:\d+\.|-)\s+\*\*(.+?)\*\*/);
      if (match) {
        options.push(match[1]);
      }
    }

    return options;
  };

  const options = extractOptions(responseText);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isCommandLoading ? (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                {isCommandLoading ? 'Processing...' : 'Command Result'}
              </h2>
              {currentCommand && (
                <p className="text-xs text-zinc-500 font-mono">{currentCommand}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-auto p-6"
        >
          {isCommandLoading && !responseText ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Waiting for response...</p>
            </div>
          ) : responseText ? (
            <div className="space-y-1">
              {formatResponse(responseText)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Info className="w-8 h-8 mb-4" />
              <p>No response yet</p>
            </div>
          )}
        </div>

        {/* Footer with quick actions */}
        {options.length > 0 && !isCommandLoading && (
          <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
            <p className="text-xs text-zinc-500 mb-3">Quick Options:</p>
            <div className="flex flex-wrap gap-2">
              {options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    // Send the option as a follow-up message
                    useGameStore.getState().sendToCli({
                      type: 'prompt',
                      prompt: option,
                      sessionId: useGameStore.getState().sessionId,
                    });
                  }}
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Close button - hidden during loading */}
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
          {isCommandLoading ? (
            <span className="text-xs text-zinc-500 italic">Processing command...</span>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
            >
              {options.length > 0 ? 'Close' : 'Done'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
