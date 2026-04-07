"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import { ScoreRing, getVerdict } from "../components/ScoreRing";
import DashboardLayout from "../components/DashboardLayout";


const MOCK_READINGS = [
  { id: "1", destination: "Tokyo, Japan", score: 87, travelDate: "2026-05-12", travelType: "trip" },
  { id: "2", destination: "Paris, France", score: 62, travelDate: "2026-07-22", travelType: "trip" },
  { id: "3", destination: "Bali, Indonesia", score: 91, travelDate: "2026-09-01", travelType: "relocation" },
];

export default function ReadingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) {
      setReadings(MOCK_READINGS);
      return;
    }

    const fetchReadings = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const { data } = await supabase
        .from('readings')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (data) {
        setReadings(data.map(r => ({
          ...r,
          destination: r.details?.destination || "Unknown Destination",
          travelType: r.details?.travelType || r.category || "Trip",
          travelDate: r.reading_date,
          score: r.reading_score || r.details?.macroScore || 50,
        })));
      }
      setLoading(false);
    };

    fetchReadings();
  }, [isDemo]);

  return (
    <DashboardLayout title="Your Readings" kicker="HISTORY" backLabel="Home">
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>


        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {loading ? (
             <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)" }}>Loading readings...</div>
          ) : readings.length === 0 ? (
             <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)" }}>No readings found. Generate one to see it here!</div>
          ) : (
            readings.map((r, i) => {
              const verdict = getVerdict(r.score);
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => router.push(`/reading/${r.id}${isDemo ? '?demo=true' : ''}`)}
                  style={{
                    background: "var(--surface)", border: "1px solid var(--surface-border)",
                    borderRadius: "var(--shape-asymmetric-md)", padding: "var(--space-sm) var(--space-md)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", transition: "transform 0.15s ease",
                  }}
                  whileHover={{ y: -2 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                    <div style={{ transform: "scale(0.45)", transformOrigin: "left center", marginRight: "-40px", flexShrink: 0 }}>
                      <ScoreRing score={r.score} verdict={verdict} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9rem" }}>{r.destination}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)", letterSpacing: "0.05em", marginTop: "0.1rem" }}>
                        {new Date(r.travelDate).toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric" })} · {r.travelType}
                      </div>
                    </div>
                  </div>
                  <button style={{
                    background: "transparent", border: "1px solid var(--surface-border)", color: "var(--text-primary)",
                    borderRadius: "var(--radius-full)", padding: "0.35rem 1rem", fontSize: "0.75rem",
                    fontFamily: "var(--font-body)", fontWeight: 500, cursor: "pointer",
                  }}>View &rsaquo;</button>
                </motion.div>
              );
            })
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "var(--space-xl)" }}>
          <button className="btn btn-primary" onClick={() => router.push("/reading/new")} style={{ padding: "0.85rem 2rem" }}>
            + New Reading <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
