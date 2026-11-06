import { useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_REPLIES = [
  'Track my order',
  'Return policy',
  'Size guide help',
  'Talk to a stylist',
];

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi, I'm Aria — your Clotherapy style assistant. How can I help today?" },
  ]);
  const [input, setInput] = useState('');

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text: "Thanks for reaching out! Our concierge team will follow up via email shortly. In the meantime, feel free to browse our latest collection." }]);
    }, 700);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="mb-4 w-[90vw] max-w-sm bg-panel border border-line rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
            style={{ height: 440 }}
          >
            <div className="bg-gradient-to-r from-panel-light to-panel px-5 py-4 flex items-center gap-3 border-b border-line">
              <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold"><Sparkles size={16} /></div>
              <div>
                <p className="font-display text-sm text-cream">Aria · Style Assistant</p>
                <p className="text-[11px] text-gold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />Online now</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-cream-dim hover:text-gold"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.from === 'bot' ? 'bg-panel-light text-cream-dim rounded-tl-sm' : 'bg-gold text-ink ml-auto rounded-tr-sm'}`}>
                  {m.text}
                </div>
              ))}
            </div>
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {QUICK_REPLIES.map(q => (
                <button key={q} onClick={() => send(q)} className="text-[11px] border border-line hover:border-gold hover:text-gold px-3 py-1.5 rounded-full text-cream-dim transition-colors">{q}</button>
              ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); send(input); }} className="border-t border-line p-3 flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-ink border border-line rounded-full px-4 py-2 text-sm outline-none focus:border-gold" />
              <button className="w-9 h-9 rounded-full bg-gold text-ink flex items-center justify-center hover:bg-gold-bright transition-colors"><Send size={15} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full bg-gold text-ink shadow-lg shadow-black/40 flex items-center justify-center animate-float-slow"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>
    </div>
  );
}
