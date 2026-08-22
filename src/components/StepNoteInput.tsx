import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, X, Paperclip, Maximize2 } from 'lucide-react';

interface StepNoteInputProps {
  checked: boolean;
  text?: string;
  image?: string;
  onUpdateText: (text: string) => void;
  onUpdateImage: (image: string | null) => void;
  placeholder?: string;
}

export function StepNoteInput({
  checked,
  text = '',
  image,
  onUpdateText,
  onUpdateImage,
  placeholder = 'Add notes or paste chart screenshot (Ctrl+V)...',
}: StepNoteInputProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              onUpdateImage(event.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  return (
    <AnimatePresence>
      {checked && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden pl-9 pr-2"
        >
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1 font-medium">
                <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                Notes & Chart Screenshot (Paste Ctrl+V)
              </span>
              {image && (
                <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
                  <ImageIcon className="w-3 h-3" /> Image attached
                </span>
              )}
            </div>

            <textarea
              value={text}
              onChange={(e) => onUpdateText(e.target.value)}
              onPaste={handlePaste}
              placeholder={placeholder}
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-y font-sans leading-relaxed"
            />

            {image && (
              <div className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-950/90 p-2 max-h-80 flex items-center justify-center">
                <img
                  src={image}
                  alt="Pasted screenshot"
                  className="max-h-72 w-full object-contain rounded cursor-pointer"
                  onClick={() => setIsLightboxOpen(true)}
                />
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-1.5 rounded-full bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 transition-all shadow-md"
                    title="Expand image full"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateImage(null)}
                    className="p-1.5 rounded-full bg-slate-900/90 text-slate-300 hover:text-white hover:bg-red-500/80 transition-all shadow-md"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lightbox Modal */}
          {isLightboxOpen && image && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
              onClick={() => setIsLightboxOpen(false)}
            >
              <div
                className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={image}
                  alt="Full size screenshot"
                  className="max-w-full max-h-[85vh] object-contain rounded-xl border border-slate-800 shadow-2xl"
                />
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-800 transition-all shadow-xl border border-slate-700"
                  title="Close full view"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
