'use client';

import styles from './explore-buttons.module.css';

interface ExploreButtonProps {
  onClick: () => void;
}

export function LifeGoalsButton({ onClick }: ExploreButtonProps) {
  return (
    <button className={`${styles.card} ${styles.lifeGoals} editorial-btn`} onClick={onClick}>
      <div className={styles.lifeGoalsMain}>LIFE GOALS</div>
      
      <div className={styles.lifeGoalsSub}>
        Deserve all of the <em className={styles.amazingSmall}>amazing</em> things.
      </div>
      
      <svg className={styles.sunSvgLarge} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="16" stroke="currentColor" strokeWidth="6" />
        <path d="M50 10 L50 20 M50 80 L50 90 M10 50 L20 50 M80 50 L90 50 M22 22 L29 29 M71 71 L78 78 M22 78 L29 71 M71 22 L78 29" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function CouplesButton({ onClick }: ExploreButtonProps) {
  return (
    <button className={`${styles.card} ${styles.couples} editorial-btn`} onClick={onClick}>
      <div className={styles.couplesGroup}>
        <div className={styles.couplesScript}>Cosmic</div>
        <div className={styles.couplesLead}>TOGETHER</div>
        <div className={styles.couplesMain}>COUPLE</div>
      </div>
    </button>
  );
}

export function MyChartButton({ onClick }: ExploreButtonProps) {
  return (
    <button className={`${styles.card} ${styles.myChart} editorial-btn`} onClick={onClick}>
      <div className={styles.chartHeader}>
        <div className={styles.starsRow}>
          <svg width="45" height="15" viewBox="0 0 80 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 0L12 8L20 10L12 12L10 20L8 12L0 10L8 8L10 0Z" />
            <path d="M40 0L42 8L50 10L42 12L40 20L38 12L30 10L38 8L40 0Z" />
            <path d="M70 0L72 8L80 10L72 12L70 20L68 12L60 10L68 8L70 0Z" />
          </svg>
        </div>
        <div className={styles.chartGuide}>YOUR GUIDE</div>
      </div>
      
      <div className={styles.chartTitleContainer}>
        <div className={styles.chartScript}>My</div>
        <div className={styles.chartMain}>CHART</div>
      </div>
    </button>
  );
}

export function WorldChartsButton({ onClick }: ExploreButtonProps) {
  return (
    <button className={`${styles.card} ${styles.worldCharts} editorial-btn`} onClick={onClick}>
      <div className={styles.worldContent}>
        <div className={styles.worldMundane}>MUNDANE</div>
        <div className={styles.worldAstrology}>ASTROLOGY</div>
      </div>
    </button>
  );
}

export function TransitsButton({ onClick }: ExploreButtonProps) {
  return (
    <button className={`${styles.card} ${styles.transits} editorial-btn`} onClick={onClick}>
      <div className={styles.transitsKicker}>CURRENT ASTRO WEATHER</div>
      <div className={styles.transitsMain}>TRANSITS</div>
      <div className={styles.transitsSub}>What does the universe have planned for you right now?</div>
    </button>
  );
}

export function LearnButton({ onClick }: ExploreButtonProps) {
  return (
    <button className={`${styles.card} ${styles.learn} editorial-btn`} onClick={onClick}>
      <div className={styles.learnHeader}>
        <span className={styles.learnPill}>HUB</span>
      </div>
      <div className={styles.learnContent}>
        <div className={styles.learnScript}>Discover</div>
        <div className={styles.learnMain}>LEARN</div>
      </div>
    </button>
  );
}
