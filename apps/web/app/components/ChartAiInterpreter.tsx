"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

export function ChartAiInterpreter({ tab = "overview" }: { tab?: "overview" | "map" | "aspects" }) {
  const [summary, setSummary] = useState<string>("");
  const [isTyping, setIsTyping] = useState(true);

  // Mocking an AI generation sequence for demonstration
  useEffect(() => {
    let text = "";
    if (tab === "overview") {
        text = "Your chart is anchored by a Leo Sun in the 5th House of creation, giving you a natural, radiant magnetism. This is balanced by a deep, introspective Scorpio Moon in the 8th, suggesting profound emotional reserves. Your Aries Ascendant means you initiate life with fiery, pioneering energy.";
    } else if (tab === "map") {
        text = "Your strongest Astrocartography line passes directly through Jakarta, emphasizing your natal Jupiter. Relocating near this meridian could trigger sudden, disruptive, but exciting paths to abundance and philosophical expansion.";
    } else {
        text = "The tightest orb in your chart is a Moon conjunct Pluto, imbuing you with an intense emotional depth and regenerative capacity. Conversely, a Venus square Saturn indicates tension between your connection to others and your internal boundaries.";
    }
    
    let i = 0;
    setSummary("");
    setIsTyping(true);
    
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        setSummary(text.slice(0, i));
        i++;
        if (i > text.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 20); // Fast typing
      return () => clearInterval(interval);
    }, 600);
    
    return () => clearTimeout(startDelay);
  }, [tab]);

  return (
    <div style={{
      fontFamily: "var(--font-body)", 
      fontSize: "1rem", 
      lineHeight: "1.6",
      color: "var(--text-secondary)",
      padding: "0.75rem 1.25rem",
      borderLeft: "2px solid var(--text-tertiary)",
      marginBottom: "3rem",
      maxWidth: "800px" // Keep it succinct
    }}>
        <div style={{ 
          fontFamily: "var(--font-mono)", 
          fontSize: "0.6rem", 
          textTransform: "uppercase", 
          letterSpacing: "0.1em",
          marginBottom: "0.5rem",
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <Sparkles size={12} color="var(--text-tertiary)" />
          <span>Interpretations</span>
        </div>
        
        <div style={{ fontStyle: "italic", minHeight: "4rem" }}>
           {summary}
           {isTyping && (
             <motion.span 
               animate={{ opacity: [1, 0, 1] }} 
               transition={{ repeat: Infinity, duration: 0.8 }}
               style={{ display: "inline-block", width: "4px", height: "1em", background: "var(--text-tertiary)", marginLeft: "6px", verticalAlign: "middle", marginBottom: "-2px" }}
             />
           )}
        </div>
    </div>
  );
}
