import React from "react";
import Link from "next/link";
import styles from "./guide-button.module.css";

export type GuideButtonVariant =
  | "signs"
  | "chart"
  | "chartDark"
  | "sky"
  | "tradition"
  | "relocation"
  | "relocationAlt"
  | "practice"
  | "welcome";

type GuideButtonProps = {
  /** Where the button links to. */
  href: string;
  /** Color palette key — drives bg + ink + accent via the CSS module. */
  variant: GuideButtonVariant;
  /** Top-left mono kicker (e.g. "01 · START HERE", "TRADITION"). */
  kicker: string;
  /**
   * Optional top-right slot — usually a serif italic counter ("01 / 04")
   * for ordered cards, or a mono reading time ("7 MIN") for everything else.
   */
  meta?: React.ReactNode;
  /** Whether `meta` should render as the big serif counter (true) or as
   *  the muted mono reading time (false, default). */
  metaAsCounter?: boolean;
  /** Optional rotated cursive script that sits above the main word. */
  script?: string;
  /** The main word — big serif, uppercase, weight 800. */
  main: string;
  /** Optional one-line italic sub-line under the main word. */
  sub?: string;
  /**
   * Optional decoration node positioned bottom-right of the card. Use for
   * an SVG glyph (sign, planet, geometry) or a vintage illustration. Sits
   * underneath the title stack so it never collides with type.
   */
  decoration?: React.ReactNode;
  /**
   * Optional background image URL (a `/public/...` asset). Rendered with
   * `mix-blend-mode: multiply` and reduced opacity so the type stays
   * readable. Pair with one of the lighter variants (signs, chart,
   * tradition, relocation, practice) for best results.
   */
  bgImage?: string;
};

/**
 * Editorial typographic lockup for /learn hub cards. Mirrors the
 * ExploreButtons grammar (mono kicker · script · big serif main · italic
 * sub · optional decoration / bg image) so the hub feels like Chani's
 * astro-101 instead of a docs index.
 */
export function GuideButton({
  href,
  variant,
  kicker,
  meta,
  metaAsCounter = false,
  script,
  main,
  sub,
  decoration,
  bgImage,
}: GuideButtonProps) {
  return (
    <Link
      href={href}
      className={`${styles.btn} ${styles[variant]} editorial-btn`}
    >
      {bgImage && (
        <div
          aria-hidden
          className={styles.bgImage}
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      <div className={styles.header}>
        <span className={styles.kicker}>{kicker}</span>
        {meta && (
          <span
            className={metaAsCounter ? styles.counter : styles.meta}
            aria-hidden={metaAsCounter ? "true" : undefined}
          >
            {meta}
          </span>
        )}
      </div>

      <div className={styles.titleStack}>
        {script && <span className={styles.script}>{script}</span>}
        <span className={styles.main}>{main}</span>
        {sub && <span className={styles.sub}>{sub}</span>}
      </div>

      {decoration && (
        <div aria-hidden className={styles.decoration}>
          {decoration}
        </div>
      )}
    </Link>
  );
}
