"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import StarBackground from "./components/StarBackground";
import Navbar from "./components/Navbar";
import styles from "./page.module.css";


export default function Home() {
  return (
    <>
      <StarBackground />

      <Navbar />

      <main className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <motion.div
              className={styles.heroContent}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <h1 className={styles.headline}>
                Where should<br />
                you travel next
              </h1>
              <p className={styles.subline}>
                You deserve the best possible environment to thrive in and fulfil your natal promise.
                Use our astrocartography travel planner to figure out where to go — and when.
              </p>
              <Link href="/flow" className="btn btn-primary" id="cta-start">
                Start planning <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              className={styles.heroImage}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <Image
                src="/astronat-hero.jpg"
                alt="Astro Nat on a red Vespa surrounded by cypress trees"
                fill
                className={styles.heroImg}
                priority
              />
            </motion.div>
          </div>
        </div>
      </main>

      <section className={styles.process}>
        <div className="container">
          <h5 className={styles.sectionLabel}>How it works</h5>
          <div className={styles.steps}>
            {[
              {
                number: "01",
                title: "Your chart",
                desc: "Enter your birth details. We calculate your natal chart and project it across the globe using Swiss Ephemeris.",
              },
              {
                number: "02",
                title: "Your destination",
                desc: "Choose where you're going. We'll show which planetary lines are active and what they mean for that city.",
              },
              {
                number: "03",
                title: "Your timing",
                desc: "See the next 12 months of transits mapped to your houses. Travel when the planets support it — not against them.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                className={styles.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <span className={styles.stepNum}>{step.number}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.quote}>
        <div className="container">
          <blockquote className={styles.blockquote}>
            <p>
              "Astrocartography isn't about luck. It's about understanding which locations
              activate your chart — and planning around that."
            </p>
            <cite className={styles.cite}>— Astro Nat</cite>
          </blockquote>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <span>Astro Nat © 2026</span>
            <span>Swiss Ephemeris · Locational Astrology</span>
          </div>
        </div>
      </footer>
    </>
  );
}
