import { useState } from "react";
import { Bot, X, ChevronRight, Play } from "lucide-react";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-neon-blue to-primary p-0.5 shadow-[0_0_20px_rgba(0,186,255,0.3)] transition-all duration-500 hover:scale-110 hover:shadow-[0_0_30px_rgba(0,186,255,0.5)] ${isOpen ? 'rotate-90' : ''}`}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0a0a1a] transition-colors group-hover:bg-transparent">
          <Bot className={`h-8 w-8 text-white transition-all duration-500 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
          <X className={`absolute h-8 w-8 text-white transition-all duration-500 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
        </div>
        
        {/* Pulse Effect */}
        <div className="absolute inset-0 animate-ping rounded-full bg-neon-blue/20" />
      </button>

      {/* Assistant Modal */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[350px] overflow-hidden rounded-2xl border border-neon-blue/30 bg-[#050510]/95 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 p-6">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-neon-blue" />
              <h3 className="font-display text-lg font-black tracking-widest text-white uppercase">AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            <p className="mb-8 text-sm font-bold tracking-wider text-muted-foreground/80">
              Coming soon! I'll help you with:
            </p>

            <ul className="space-y-6">
              <AssistantFeature text="Race strategies" />
              <AssistantFeature text="Car recommendations" />
              <AssistantFeature text="Mission tips" />
            </ul>

            <div className="mt-10 rounded-xl border border-neon-blue/20 bg-neon-blue/5 p-4">
              <div className="flex items-center gap-3 text-neon-blue">
                <div className="h-2 w-2 animate-pulse rounded-full bg-neon-blue" />
                <span className="text-[10px] font-black tracking-[0.2em] uppercase">Neural Link Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssistantFeature({ text }: { text: string }) {
  return (
    <li className="group flex items-center gap-4">
      <div className="flex h-6 w-6 items-center justify-center">
        <Play className="h-3 w-3 fill-neon-blue text-neon-blue transition-transform group-hover:scale-125" />
      </div>
      <span className="font-display text-sm font-black tracking-widest text-white/90 group-hover:text-neon-blue transition-colors uppercase">
        {text}
      </span>
    </li>
  );
}
