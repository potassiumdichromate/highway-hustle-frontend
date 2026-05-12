export default function NeuralBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-[#050510] overflow-hidden pointer-events-none">
      {/* Scrolling grid — CSS only, zero JS, runs on compositor thread */}
      <div className="neural-grid absolute inset-0" aria-hidden />

      {/* Ambient glow blobs */}
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#f43f5e]/10 blur-[100px]" aria-hidden />
      <div className="absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-[#06b6d4]/10 blur-[100px]" aria-hidden />
      <div className="absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-[#7c3aed]/8 blur-[80px]" aria-hidden />

      {/* Bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050510]/40 via-transparent to-[#050510]" aria-hidden />

      <style>{`
        .neural-grid {
          background-image:
            linear-gradient(to right, rgba(6,182,212,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6,182,212,0.07) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: neural-scroll 12s linear infinite;
        }
        @keyframes neural-scroll {
          from { background-position: 0 0; }
          to   { background-position: 60px 60px; }
        }
      `}</style>
    </div>
  );
}
