import { ArrowRight } from 'lucide-react';
import { EXPORT_PRESETS } from '../utils/exportPresets';

interface AboutViewProps {
  onOpenEditor: () => void;
}

const HOW_IT_WORKS = [
  {
    step: '01. Pick a song',
    title: 'Search or paste a Spotify link',
    body: 'Find any track via instant search or paste a Spotify URL to pull high-resolution cover art, track metadata, and a matching scannable code.',
  },
  {
    step: '02. Style your poster',
    title: 'Choose a layout and tune tokens',
    body: 'Switch between Glass Player, Minimal Cover, Vinyl, Receipt, Editorial Frame, and Minimal Sleeve while adjusting blur, typography, theme, and color.',
  },
  {
    step: '03. Export for print',
    title: 'Preview in a frame and download',
    body: 'Check the composition leaning inside the studio frame, then export print-ready PNG or PDF files up to A2 at 300 DPI.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'How do the scannable Spotify codes work?',
    a: 'When you paste a Spotify track link, Melodra fetches the official scannable barcode for that song. You can also drag and drop or upload your own Spotify code image anytime.',
  },
  {
    q: 'What paper and frame sizes work best?',
    a: 'Matte heavyweight archival paper (200–250 gsm) avoids glare behind glass. A4 and A3 fit standard metric frames, while 12×18 in and Square 12×12 fit common US poster and LP record frames.',
  },
  {
    q: 'Why does Melodra warn about covers under 1000 px?',
    a: 'Large prints such as A3 and A2 need dense source artwork so edges stay sharp at arm’s length. Song search automatically requests 3000 × 3000 px artwork whenever available.',
  },
  {
    q: 'Are my posters or uploaded images sent to a server?',
    a: 'No. Rendering, dominant-color extraction, and PNG/PDF generation all run locally inside your browser.',
  },
];

export function AboutView({ onOpenEditor }: AboutViewProps) {
  return (
    <main className="flex-1 overflow-y-auto studio-scrollbar bg-[#0B0B0C] px-5 sm:px-8 py-12">
      <div className="max-w-4xl mx-auto space-y-14">
        {/* Hero */}
        <section className="space-y-5 border-b border-white/[0.08] pb-10">
          <p className="text-xs font-medium text-[#1DB954] tracking-wide">Melodra Print Studio</p>
          <h1
            className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#F5F5F5] max-w-2xl"
            style={{ textWrap: 'balance' }}
          >
            Turn any song into wall art
          </h1>
          <p className="text-sm sm:text-base text-[#8E8E93] max-w-2xl leading-relaxed">
            Melodra pairs track artwork and metadata with modular poster layouts, live visual
            tokens, and 300 DPI print exports—all inside a calm, client-side studio.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenEditor}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] active:scale-[0.98] text-[#07110B] text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
            >
              <span>Open Studio Editor</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* 3-Step How It Works */}
        <section className="space-y-5">
          <h2 className="text-lg font-semibold text-[#F5F5F5] tracking-tight">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="rounded-xl bg-[#151517] border border-white/[0.08] p-5 space-y-2.5"
              >
                <div className="text-xs font-medium text-[#1DB954] tabular-nums">{item.step}</div>
                <h3 className="text-sm font-semibold text-[#F5F5F5]">{item.title}</h3>
                <p className="text-xs text-[#8E8E93] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Print-Size Guide Table */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[#F5F5F5] tracking-tight">
              Print-size guide
            </h2>
            <p className="text-xs text-[#8E8E93] mt-1">
              All exports render at approximately 300 DPI for crisp typography and album art.
            </p>
          </div>

          <div className="rounded-xl bg-[#151517] border border-white/[0.08] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] font-medium text-[#8E8E93]">
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Inches</th>
                  <th className="py-3 px-4">Pixels (~300 DPI)</th>
                  <th className="py-3 px-4">Recommended Frame</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs">
                {EXPORT_PRESETS.map((preset) => (
                  <tr key={preset.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#F5F5F5] whitespace-nowrap">
                      {preset.label}
                    </td>
                    <td className="py-3 px-4 text-[#F5F5F5] tabular-nums whitespace-nowrap">
                      {preset.dimensionsIn}
                    </td>
                    <td className="py-3 px-4 text-[#8E8E93] font-mono tabular-nums whitespace-nowrap">
                      {preset.outputWidthPx} × {preset.outputHeightPx} px
                    </td>
                    <td className="py-3 px-4 text-[#8E8E93]">{preset.recommendedFrame}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Small FAQ */}
        <section className="space-y-4 pb-6">
          <h2 className="text-lg font-semibold text-[#F5F5F5] tracking-tight">
            Frequently asked questions
          </h2>
          <div className="divide-y divide-white/[0.08] rounded-xl bg-[#151517] border border-white/[0.08]">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="p-5 space-y-1.5">
                <h3 className="text-sm font-medium text-[#F5F5F5]">{item.q}</h3>
                <p className="text-xs text-[#8E8E93] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
