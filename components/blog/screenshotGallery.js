"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { urlForWidth } from "@/lib/sanity/image";

// Images come straight from Sanity's CDN at the size the screen needs
// (no Vercel Image Optimization quota is used).
const WIDTHS = [640, 960, 1280, 1920];
const SIZES = "(max-width: 800px) 100vw, 768px";
const SWIPE_MIN_PX = 40;

function Arrow({ direction }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

/**
 * Carousel for the post's "screenshots" (Sanity image array): one image at a
 * time, left/right buttons, swipe on touch screens and arrow keys. Only the
 * current image and its neighbours are loaded, so a post can have any number
 * of screenshots without slowing the page down.
 */
export default function ScreenshotGallery({ images = [] }) {
  const slides = images.filter((image) => image?.asset);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(() => new Set());
  const touchStartX = useRef(null);

  const goTo = useCallback(
    (next) => setIndex(((next % count) + count) % count),
    [count]
  );

  // Load the current image and the ones next to it (wrapping around).
  useEffect(() => {
    if (count === 0) return;
    setLoaded((previous) => {
      const wanted = [index - 1, index, index + 1].map(
        (i) => (i + count) % count
      );
      if (wanted.every((i) => previous.has(i))) return previous;
      const next = new Set(previous);
      wanted.forEach((i) => next.add(i));
      return next;
    });
  }, [index, count]);

  if (count === 0) return null;

  const onKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    }
  };

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };
  const onTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_MIN_PX) return;
    goTo(deltaX < 0 ? index + 1 : index - 1);
  };

  const buttonClass =
    "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow transition-colors hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <section
      className="not-prose my-8 w-full select-none"
      aria-roledescription="carrossel"
      aria-label="Screenshots"
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative overflow-hidden rounded-lg bg-black">
        <div
          className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((image, i) => (
            <div
              key={image._key || i}
              className="relative aspect-video w-full shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${count}`}
              aria-hidden={i !== index}
            >
              {loaded.has(i) && (
                <img
                  src={urlForWidth(image, 1280)}
                  srcSet={WIDTHS.map(
                    (w) => `${urlForWidth(image, w)} ${w}w`
                  ).join(", ")}
                  sizes={SIZES}
                  alt={image.alt || `Screenshot ${i + 1}`}
                  className="absolute inset-0 h-full w-full object-contain"
                  decoding="async"
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className={`${buttonClass} left-3`}
              aria-label="Imagem anterior"
            >
              <Arrow direction="left" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className={`${buttonClass} right-3`}
              aria-label="Próxima imagem"
            >
              <Arrow direction="right" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <p
          className="mt-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
          aria-live="polite"
        >
          {index + 1} / {count}
        </p>
      )}
    </section>
  );
}
