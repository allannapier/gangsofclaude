import { useGameStore } from '../store';
import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Trash2, Terminal } from 'lucide-react';

interface ClaudeOutputProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ClaudeOutput({ isExpanded, onToggleExpand }: ClaudeOutputProps) {
  const { claudeOutput, setClaudeOutput } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [claudeOutput, isExpanded]);

  // Format the output for better readability
  const formatOutput = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('> /')) {
        elements.push(
          <div key={key++} className="mt-4 mb-2">
            <span className="text-zinc-500">{'>'}</span>
            <span className="text-purple-400 font-semibold">{line.substring(2)}</span>
          </div>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={key++} className="h-2" />);
      } else {
        elements.push(
          <div key={key++} className="text-zinc-300 leading-relaxed">
            {line}
          </div>
        );
      }
    }

    return elements;
  };

  const lineCount = claudeOutput.split('\n').length;
  const charCount = claudeOutput.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header - Always visible */}
      <div
        className="px-4 py-2 flex items-center justify-between bg-zinc-900/80 cursor-pointer hover:bg-zinc-800/80 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Command Output</span>
          {claudeOutput && !isExpanded && (
            <span className="text-xs text-zinc-600 ml-2">
              ({lineCount} lines, {charCount} chars - click to expand)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {claudeOutput && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setClaudeOutput('');
              }}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
              title="Clear output"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onToggleExpand}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content - Only shown when expanded */}
      {isExpanded && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto p-4 text-sm"
        >
          {claudeOutput ? (
            <div className="space-y-1">
              {formatOutput(claudeOutput)}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-600">
              <div className="text-center">
                <div className="text-2xl mb-2">💬</div>
                <p className="text-sm">Command responses will appear here</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed preview bar */}
      {!isExpanded && claudeOutput && (
        <div
          className="px-4 py-2 text-xs text-zinc-500 truncate cursor-pointer hover:bg-zinc-800/50 transition-colors border-t border-zinc-800/50"
          onClick={onToggleExpand}
        >
          <span className="text-zinc-400">Latest:</span>{' '}
          {claudeOutput.split('\n').slice(-3).join(' ').substring(0, 100)}
          {claudeOutput.length > 100 && '...'}
        </div>
      )}
    </div>
  );
}
