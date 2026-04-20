import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const slides = [
  {
    tag: 'AI-Powered Recruitment',
    title: 'Hire smarter,\nnot harder.',
    description: 'Automate candidate screening, generate tailored interview questions, and surface the best talent with AI-driven analysis.',
    image: '/assets/back1.webp',
  },
  {
    tag: 'Interview Generation',
    title: 'Questions that\nreveal potential.',
    description: 'Generate personalised interview questions based on each candidate\'s skills and experience — no more generic screens.',
    image: '/assets/back2.webp',
  },
  {
    tag: 'Answer Analysis',
    title: 'Evaluate at\nscale.',
    description: 'Automatically score video interview responses and rank candidates so you can focus on what matters most.',
    image: '/assets/back3.webp',
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const go = (i) => {
    setCurrent((i + slides.length) % slides.length);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => go(current + 1), 6000);
    return () => clearInterval(timerRef.current);
  }, [current]);

  const slide = slides[current];

  return (
    <section className="relative w-full min-h-screen flex items-center overflow-hidden bg-brand-base">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          key={current}
          src={slide.image}
          alt=""
          className="w-full h-full object-cover opacity-20 dark:opacity-15 transition-opacity duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-base via-brand-base/90 to-brand-surface/50" />
      </div>

      {/* Decorative amber glow */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-brand-accent/5 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 py-24 w-full">
        <div className="max-w-2xl">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/10 mb-6 animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold text-brand-accent tracking-wide uppercase">{slide.tag}</span>
          </div>

          {/* Title */}
          <h1
            key={`title-${current}`}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-brand-text-primary leading-[1.05] tracking-tight mb-6 animate-slideUp whitespace-pre-line"
          >
            {slide.title}
          </h1>

          {/* Description */}
          <p
            key={`desc-${current}`}
            className="text-lg text-brand-text-muted leading-relaxed mb-10 max-w-xl animate-fadeIn"
          >
            {slide.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent hover:bg-brand-accent-hover text-gray-900 font-semibold rounded-xl text-sm transition-all shadow-glow hover:shadow-lg active:scale-95"
            >
              Get started free
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 border border-brand-border bg-brand-surface/50 hover:bg-brand-elevated text-brand-text-primary font-medium rounded-xl text-sm transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="flex items-center gap-2 mt-16">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-8 h-2 bg-brand-accent'
                  : 'w-2 h-2 bg-brand-border hover:bg-brand-text-muted'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-brand-border bg-brand-surface/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-4 flex flex-wrap gap-8">
          {[
            { value: '10k+', label: 'Candidates processed' },
            { value: '98%',  label: 'Match accuracy' },
            { value: '3×',   label: 'Faster hiring' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-lg font-bold text-brand-accent">{value}</div>
              <div className="text-xs text-brand-text-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
