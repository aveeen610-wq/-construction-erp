import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageSlider({ images, interval = 4000, className = '' }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [next, interval, images.length]);

  if (!images || images.length === 0) return null;

  return (
    <div className={`relative w-full h-64 md:h-80 overflow-hidden bg-gray-900 ${className}`}>
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out"
          style={{
            opacity: i === current ? 1 : 0,
          }}
          draggable={false}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm transition-all"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? 'bg-white w-6 h-2'
                    : 'bg-white/50 w-2 h-2 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          <div className="absolute top-2 right-2 z-20 bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
            {current + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
