import React, { useState, useEffect, useRef } from 'react';

export default function FreeShipping() {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);
  const MARQUEE_DURATION = 35; // seconds (default)
  const MARQUEE_SLOW_DURATION = 35; // seconds for slower CALL TO ORDER message
  const messages = [
    {
      id: 'promo',
      text: 'Up to 30% off when you buy multiple items | Free shipping Nationwide!',
      className: 'text-white font-normal',
      sizeClass: 'text-lg md:text-xl lg:text-2xl',
      duration: MARQUEE_DURATION,
    },
    {
      id: 'call',
      text: 'CALL TO ORDER: +234 906 500 0541, +44 1908 768447',
      className: 'font-bold',
      color: '#112639',
      sizeClass: 'text-lg md:text-2xl lg:text-3xl',
      duration: MARQUEE_SLOW_DURATION,
    },
  ];
  // per-character constants removed — using a single continuous marquee now
  const [currentIndex, setCurrentIndex] = useState(0);
  const marqueeContainerRef = useRef(null);
  const textRef = useRef(null);
  const [computedDuration, setComputedDuration] = useState(null); // seconds
  useEffect(() => {
    // Inject marquee keyframes + reduced-motion fallback once
    if (typeof document !== 'undefined' && !document.getElementById('freeShippingMarqueeStyles')) {
      const style = document.createElement('style');
      style.id = 'freeShippingMarqueeStyles';
      style.innerHTML = `
        @keyframes freeShippingMarquee {
           /* Start slightly further off-screen but reduce the dead gap between messages.
             Using 130% start gives entrance distance 130 and exit 100, so entrance
             should take ~56.5% of the time to keep the linear speed uniform. */
           0% { transform: translateX(130%); }
           56.5% { transform: translateX(0); }
           100% { transform: translateX(-100%); }
        }
        @keyframes freeShippingCharEnter {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .free-shipping-marquee-inner { animation: none !important; }
        }
      `;
      document.head.appendChild(style);
    }

    // Check if user is logged in (simple check: userData in localStorage)
    const userData = localStorage.getItem('userData');
    if (!userData) {
      // If user is logged out, clear the dismissal flag so banner can show again
      localStorage.removeItem('freeShippingDismissed');
    }
    // Check localStorage for dismissal state
    const isDismissed = localStorage.getItem('freeShippingDismissed');
    if (!isDismissed && !userData) {
      // Slight delay so the page layout stabilizes before the banner appears
      setTimeout(() => setIsVisible(true), 50);
    }
  }, []);

  // Compute animation duration based on rendered widths so speed feels consistent across breakpoints
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let raf = null;
    let resizeTimeout = null;

    const computeDuration = () => {
      // If user prefers reduced motion, do not compute
      const prefersReducedLocal = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedLocal) {
        setComputedDuration(null);
        return;
      }
      const container = marqueeContainerRef.current;
      const textEl = textRef.current;
      if (!container || !textEl) return;

      // measure widths
      const containerWidth = container.clientWidth;
      const textWidth = textEl.scrollWidth;

      // Choose start multiplier based on viewport width: desktop 200%, tablet 130%, mobile 100%
      const vw = window.innerWidth || document.documentElement.clientWidth || 0;
      let START_MULTIPLIER = 1.3; // default (tablet)
      if (vw >= 1024) START_MULTIPLIER = 1.65; // desktop
      else if (vw < 768) START_MULTIPLIER = 0.5; // mobile

      // Update injected keyframes so translateX start matches START_MULTIPLIER and entrance timing is proportional
      const entrancePercent = (START_MULTIPLIER / (START_MULTIPLIER + 1)) * 100;
      const styleEl = document.getElementById('freeShippingMarqueeStyles');
      if (styleEl) {
        styleEl.innerHTML = `
        @keyframes freeShippingMarquee {
          0% { transform: translateX(${START_MULTIPLIER * 100}%); }
          ${entrancePercent}% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        @keyframes freeShippingCharEnter {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .free-shipping-marquee-inner { animation: none !important; }
        }
      `;
      }

      // total distance the text needs to travel: start (off-screen right) to fully off-screen left
      const startOffset = containerWidth * START_MULTIPLIER;
      const endOffset = textWidth + containerWidth; // to move fully past left edge
      const distance = startOffset + endOffset;

      // Choose a pixels-per-second speed that feels reasonable across devices
      const PX_PER_SECOND = 50; // px/s; tweakable
      const durationSec = Math.max(6, distance / PX_PER_SECOND); // enforce a minimum duration
      setComputedDuration(durationSec);
    };

    const scheduleCompute = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(computeDuration);
    };

    scheduleCompute();

    const onResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(scheduleCompute, 120);
    };

    window.addEventListener('resize', onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener('resize', onResize);
    };
  }, [currentIndex]);

  // If user prefers reduced motion, rotate messages via JS timer instead of CSS animation
  useEffect(() => {
    // If the user prefers reduced motion, do not auto-rotate messages.
    // Keep the current message static to respect accessibility preferences.
    // Normal (animated) rotation is handled by CSS animation + onAnimationEnd.
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq && mq.matches) {
      // Explicitly ensure we stay on the first message when reduced motion is requested
      setCurrentIndex(0);
    }
    return undefined;
  }, [messages.length]);

  

  const handleDismiss = () => {
    // play exit animation then remove
    setIsDismissing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsDismissing(false);
      try { localStorage.setItem('freeShippingDismissed', 'true'); } catch (e) { /* ignore */ }
    }, 300); // match exit animation duration
  };

  if (!isVisible) return null;

  const current = messages[currentIndex];
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleAnimationEnd = () => {
    // advance to next message when animation completes
    setCurrentIndex((i) => (i + 1) % messages.length);
  };
  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#eb9325] ${isDismissing ? 'animate-free-shipping-exit' : 'animate-free-shipping-enter'}`}
      role="region"
      aria-label="Free shipping banner"
    >
  {/* Visually hidden static text for screen readers - announce current message */}
  <span className="sr-only">{current.text}</span>

      <div
        className="flex items-center w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
  <div className="w-full overflow-hidden" ref={marqueeContainerRef}>
          <div
            key={currentIndex}
            className="free-shipping-marquee-inner whitespace-nowrap flex items-center"
            aria-hidden="true"
            style={{ display: 'inline-flex', gap: '2rem', padding: '0.5rem 1rem' }}
          >
            <span
              className={`${current.className} ${current.sizeClass || 'text-lg'} max-md:text-base m-1 max-md:m-0 text-center py-2 inline-block`}
              ref={textRef}
              style={{
                display: 'inline-block',
                animationName: prefersReduced ? 'none' : 'freeShippingMarquee',
                animationDuration: prefersReduced ? '0s' : `${(computedDuration || current.duration).toString()}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: prefersReduced ? '1' : '1',
                animationFillMode: 'forwards',
                animationPlayState: isPaused ? 'paused' : 'running',
                color: current.color || undefined,
                whiteSpace: 'nowrap',
              }}
              onAnimationEnd={() => { if (!prefersReduced) handleAnimationEnd(); }}
            >
              {current.text}
            </span>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="ml-4 mr-3 text-white hover:text-gray-200 p-2"
          title="Dismiss"
          aria-label="Dismiss free shipping banner"
        >
          <i className="bx bx-x text-xl" aria-hidden="true"></i>
        </button>
      </div>

      {/* entrance/exit keyframes (scoped via inline style tag fallback if not present) */}
      <style>{`
        @keyframes freeShippingEnter { from { transform: translateY(-100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes freeShippingExit { from { transform: translateY(0); opacity: 1 } to { transform: translateY(-100%); opacity: 0 } }
        .animate-free-shipping-enter { animation: freeShippingEnter 300ms ease forwards; }
        .animate-free-shipping-exit { animation: freeShippingExit 300ms ease forwards; }
        @media (prefers-reduced-motion: reduce) {
          .free-shipping-marquee-inner { animation: none !important; }
          .animate-free-shipping-enter, .animate-free-shipping-exit { animation: none !important; }
        }
      `}</style>
    </div>
  );
}