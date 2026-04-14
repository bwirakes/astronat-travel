"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import ThemeToggle from "@/app/components/ThemeToggle";
import { ScoreRing, getVerdict } from "@/app/components/ScoreRing";
import DashboardLayout from "@/app/components/DashboardLayout";


const MOCK_READINGS = [
  { id: "1", destination: "Tokyo, Japan", score: 87, travelDate: "2026-05-12", travelType: "trip" },
  { id: "2", destination: "Paris, France", score: 62, travelDate: "2026-07-22", travelType: "trip" },
  { id: "3", destination: "Bali, Indonesia", score: 91, travelDate: "2026-09-01", travelType: "relocation" },
];

function ReadingsContent() {
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


        <div style={{ 
          display: "flex", 
          flexWrap: "wrap",
          gap: "var(--space-md)",
          alignItems: "stretch" 
        }}>
          {loading ? (
             <div style={{ width: "100%", padding: "2rem", textAlign: "center", color: "var(--text-tertiary)" }}>Loading readings...</div>
          ) : readings.length === 0 ? (
             <div style={{ width: "100%", padding: "2rem", textAlign: "center", color: "var(--text-tertiary)" }}>No readings found. Generate one to see it here!</div>
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
                    flex: "1 1 300px",
                    maxWidth: "100%",
                    background: "var(--surface)", border: "1px solid var(--surface-border)",
                    borderRadius: "var(--shape-asymmetric-md)", padding: "var(--space-md)",
                    display: "flex", flexDirection: "column", gap: "var(--space-md)",
                    cursor: "pointer", transition: "transform 0.15s ease",
                  }}
                  whileHover={{ y: -2 }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                      <div style={{ transform: "scale(0.6)", transformOrigin: "left center", marginRight: "-30px", flexShrink: 0 }}>
                        <ScoreRing score={r.score} verdict={verdict} />
                      </div>
                      <div style={{ paddingTop: "0.2rem" }}>
                        <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "1rem", lineHeight: 1.2 }}>{r.destination}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)", letterSpacing: "0.05em", marginTop: "0.3rem" }}>
                          {new Date(r.travelDate).toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric" })} · {r.travelType}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button style={{
                      background: "transparent", border: "1px solid var(--surface-border)", color: "var(--text-primary)",
                      borderRadius: "var(--radius-full)", padding: "0.35rem 1rem", fontSize: "0.75rem",
                      fontFamily: "var(--font-body)", fontWeight: 500, cursor: "pointer",
                    }}>View &rsaquo;</button>
                  </div>
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

export default function ReadingsPage() {
  return (
    <Suspense fallback={null}>
      <ReadingsContent />
    </Suspense>
  );
}
