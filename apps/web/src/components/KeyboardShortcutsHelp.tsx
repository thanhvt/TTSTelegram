/**
 * KeyboardShortcutsHelp - Hiển thị bảng phím tắt
 *
 * @description Tooltip hiển thị các phím tắt khả dụng
 */

import { Keyboard, X } from 'lucide-react';
import { useState } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const { shortcuts } = useKeyboardShortcuts();

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-ghost p-2"
        title="Phím tắt"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      {/* Popup */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Content */}
          <div className="absolute right-0 top-full mt-2 z-50 w-64 card shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Phím tắt</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-400">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-surface-light rounded text-xs text-white font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
