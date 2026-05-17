"use client";

export default function NewReadingLoading() {
  return (
    <div className="reading-new-loading" aria-busy="true" aria-live="polite">
      <div className="reading-new-loading__bg" aria-hidden>
        compare
      </div>
      <div className="reading-new-loading__content">
        <div className="reading-new-loading__kicker" />
        <div className="reading-new-loading__title" />
        <div className="reading-new-loading__title reading-new-loading__title--short" />
        <div className="reading-new-loading__line" />
        <div className="reading-new-loading__line reading-new-loading__line--short" />
        <div className="reading-new-loading__tier" />
        <div className="reading-new-loading__tier reading-new-loading__tier--active" />
        <div className="reading-new-loading__tier" />
        <div className="reading-new-loading__cta" />
      </div>

      <style jsx>{`
        .reading-new-loading {
          position: relative;
          width: 100vw;
          height: calc(100dvh - var(--page-header-height, 64px));
          min-height: calc(100dvh - var(--page-header-height, 64px));
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          overflow: hidden;
          background: var(--color-y2k-blue);
          color: white;
        }

        .reading-new-loading__bg {
          position: absolute;
          right: -0.35em;
          top: 0.04em;
          font-family: var(--font-display-alt-2);
          font-size: clamp(5rem, 26vw, 8rem);
          line-height: 0.75;
          opacity: 0.09;
          pointer-events: none;
        }

        .reading-new-loading__content {
          position: relative;
          z-index: 1;
          height: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.62rem;
          padding: clamp(1rem, 5vw, 1.35rem);
        }

        .reading-new-loading__kicker,
        .reading-new-loading__title,
        .reading-new-loading__line,
        .reading-new-loading__tier,
        .reading-new-loading__cta {
          background: color-mix(in srgb, white 24%, transparent);
          animation: reading-new-loading-pulse 1.2s ease-in-out infinite;
        }

        .reading-new-loading__kicker {
          width: 44%;
          height: 0.7rem;
          margin-bottom: 0.5rem;
        }

        .reading-new-loading__title {
          width: min(78%, 390px);
          height: 2.2rem;
        }

        .reading-new-loading__title--short {
          width: min(58%, 280px);
          margin-bottom: 0.35rem;
        }

        .reading-new-loading__line {
          width: min(86%, 420px);
          height: 0.9rem;
        }

        .reading-new-loading__line--short {
          width: min(62%, 320px);
          margin-bottom: 0.45rem;
        }

        .reading-new-loading__tier {
          height: 68px;
          border: 1.5px solid color-mix(in srgb, white 68%, transparent);
          background: color-mix(in srgb, var(--color-y2k-blue) 78%, black 22%);
        }

        .reading-new-loading__tier--active {
          background: white;
        }

        .reading-new-loading__cta {
          height: 44px;
          margin-top: 0.15rem;
          border-radius: var(--shape-asymmetric-md);
          background: white;
          box-shadow: 0 8px 0 color-mix(in srgb, black 18%, transparent);
        }

        @media (min-width: 1181px) {
          .reading-new-loading {
            width: 820px;
            height: auto;
            min-height: 460px;
            margin: var(--space-sm) auto 0;
            border: 1px solid var(--surface-border);
            border-radius: var(--shape-asymmetric-md);
          }

          .reading-new-loading__content {
            max-width: 420px;
            margin-left: auto;
            padding: clamp(1.25rem, 3vw, 2.25rem);
          }
        }

        @keyframes reading-new-loading-pulse {
          0%,
          100% {
            opacity: 0.52;
          }
          50% {
            opacity: 0.82;
          }
        }
      `}</style>
    </div>
  );
}
