"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { urlForWidth } from "@/lib/sanity/image";

// Images come straight from Sanity's CDN at the size the screen needs
// (no Vercel Image Optimization quota is used).
const WIDTHS = [640, 960, 1280, 1920];
const SIZES = "(max-width: 800px) 100vw, 768px";
// Enlarged view: bigger files, only downloaded when someone opens it.
const LIGHTBOX_WIDTHS = [1280, 1920, 2560];
const SWIPE_MIN_PX = 40;

function srcSetFor(image, widths) {
  return widths.map((w) => `${urlForWidth(image, w)} ${w}w`).join(", ");
}

/** Width / height of the image as shown (Sanity crop applied). */
function aspectRatioOf(image) {
  const match = /-(d+)x(d+)-/.exec(image?.asset?._ref || "");
  if (!match) return 16 / 9;
  const crop = image.crop || {};
  const width = Number(match[1]) * (1 - (crop.left || 0) - (crop.right || 0));
  const height = Number(match[2]) * (1 - (crop.top || 0) - (crop.bottom || 0));
  return width > 0 && height > 0 ? width / height : 16 / 9;
}

function Icon({ name }) {
  const paths = {
    left: "M15 18l-6-6 6-6",
    right: "M9 6l6 6-6 6",
    close: "M6 6l12 12M18 6L6 18",
  };
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
      <path d={paths[name]} />
    </svg>
  );
}

const roundButton =
  "flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white shadow transition-colors hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

/** Horizontal swipe detection; `onSwipe(+1 | -1)`. */
function useSwipe(onSwipe) {
  const startX = useRef(null);
  const lastSwipeAt = useRef(0);
  return {
    // True right after a swipe, so the tap that ends it doesn't count as a click.
    justSwiped: () => Date.now() - lastSwipeAt.current < 400,
    handlers: {
      onTouchStart: (event) => {
        startX.current = event.touches[0].clientX;
      },
      onTouchEnd: (event) => {
        if (startX.current === null) return;
        const deltaX = event.changedTouches[0].clientX - startX.current;
        startX.current = null;
        if (Math.abs(deltaX) < SWIPE_MIN_PX) return;
        lastSwipeAt.current = Date.now();
        onSwipe(deltaX < 0 ? 1 : -1);
      },
    },
  };
}

/**
 * Full-screen view of one screenshot, with the same navigation as the
 * carousel. Closes with the X button, Esc or a click outside the image.
 */
function Lightbox({ slides, index, onNavigate, onClose }) {
  const count = slides.length;
  const image = slides[index];
  const ratio = aspectRatioOf(image);
  const closeButton = useRef(null);
  const swipe = useSwipe((step) => onNavigate(index + step));

  // Keyboard, page scroll lock and focus while open.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") onNavigate(index - 1);
      else if (event.key === "ArrowRight") onNavigate(index + 1);
      else return;
      event.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [index, onNavigate, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Preload the neighbours so moving through the enlarged images is instant.
  useEffect(() => {
    if (count < 2) return;
    [index - 1, index + 1].forEach((i) => {
      const neighbour = slides[(i + count) % count];
      const preload = new window.Image();
      preload.sizes = "100vw";
      preload.srcset = srcSetFor(neighbour, LIGHTBOX_WIDTHS);
      preload.src = urlForWidth(neighbour, 1920);
    });
  }, [index, count, slides]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex select-none items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={`Screenshot ${index + 1} de ${count}`}
      onClick={(event) => {
        // Click on the dark area (not on the image or a button) closes it.
        if (event.target === event.currentTarget && !swipe.justSwiped()) {
          onClose();
        }
      }}
      {...swipe.handlers}
    >
      <img
        key={image._key || index}
        src={urlForWidth(image, 1920)}
        srcSet={srcSetFor(image, LIGHTBOX_WIDTHS)}
        sizes="100vw"
        alt={image.alt || `Screenshot ${index + 1}`}
        // As big as the screen allows (small images are scaled up too), keeping
        // the proportions; the side space is left for the arrows on desktop.
        className="h-auto [--side:2rem] sm:[--side:9rem]"
        style={{
          width: `min(calc(100vw - var(--side)), calc((100vh - 7rem) * ${ratio}))`,
          aspectRatio: String(ratio),
        }}
        draggable={false}
      />

      <button
        ref={closeButton}
        type="button"
        onClick={onClose}
        className={`${roundButton} absolute right-4 top-4`}
        aria-label="Fechar"
      >
        <Icon name="close" />
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => onNavigate(index - 1)}
            className={`${roundButton} absolute left-3 top-1/2 -translate-y-1/2 sm:left-6`}
            aria-label="Imagem anterior"
          >
            <Icon name="left" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate(index + 1)}
            className={`${roundButton} absolute right-3 top-1/2 -translate-y-1/2 sm:right-6`}
            aria-label="Próxima imagem"
          >
            <Icon name="right" />
          </button>
          <p
            className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white"
            aria-live="polite"
          >
            {index + 1} / {count}
          </p>
        </>
      )}
    </div>,
    document.body
  );
}

/**
 * Carousel for the post's "screenshots" (Sanity image array): one image at a
 * time, left/right buttons, swipe on touch screens and arrow keys. Clicking an
 * image opens it enlarged (Lightbox). Only the current image and its
 * neighbours are loaded, so a post can have any number of screenshots without
 * slowing the page down.
 */
export default function ScreenshotGallery({ images = [] }) {
  const slides = useMemo(
    () => images.filter((image) => image?.asset),
    [images]
  );
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(() => new Set());
  const slideButtons = useRef([]);

  const goTo = useCallback(
    (next) => setIndex(((next % count) + count) % count),
    [count]
  );
  const swipe = useSwipe((step) => goTo(index + step));

  const close = useCallback(() => setOpen(false), []);
  const wasOpen = useRef(false);
  // Give the focus back to the carousel when the enlarged view closes.
  useEffect(() => {
    if (wasOpen.current && !open) slideButtons.current[index]?.focus();
    wasOpen.current = open;
  }, [open, index]);

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

  // Events from the Lightbox (a portal) still bubble here through React:
  // ignore them while it is open so nothing is handled twice.
  const onKeyDown = (event) => {
    if (open) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    }
  };
  const onTouchStart = (event) => {
    if (!open) swipe.handlers.onTouchStart(event);
  };
  const onTouchEnd = (event) => {
    if (!open) swipe.handlers.onTouchEnd(event);
  };

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
              <button
                ref={(element) => (slideButtons.current[i] = element)}
                type="button"
                tabIndex={i === index ? 0 : -1}
                onClick={() => {
                  if (!swipe.justSwiped()) setOpen(true);
                }}
                className="absolute inset-0 h-full w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                aria-label={`Ampliar screenshot ${i + 1}`}
              >
                {loaded.has(i) && (
                  <img
                    src={urlForWidth(image, 1280)}
                    srcSet={srcSetFor(image, WIDTHS)}
                    sizes={SIZES}
                    alt={image.alt || `Screenshot ${i + 1}`}
                    className="h-full w-full object-contain"
                    decoding="async"
                    draggable={false}
                  />
                )}
              </button>
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className={`${roundButton} absolute left-3 top-1/2 -translate-y-1/2`}
              aria-label="Imagem anterior"
            >
              <Icon name="left" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className={`${roundButton} absolute right-3 top-1/2 -translate-y-1/2`}
              aria-label="Próxima imagem"
            >
              <Icon name="right" />
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

      {open && (
        <Lightbox
          slides={slides}
          index={index}
          onNavigate={goTo}
          onClose={close}
        />
      )}
    </section>
  );
}
