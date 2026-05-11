"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface Suggestion {
    label: string;
    lat: number;
    lon: number;
    type: string;
}

interface CityAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (suggestion: Suggestion) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    id?: string;
}

export default function CityAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = "e.g. Jakarta, Indonesia",
    label,
    className,
    id,
}: CityAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // Suppresses the next fetch after a programmatic value change from handleSelect,
    // otherwise the value-watching effect re-opens the dropdown right after a pick.
    const skipNextFetchRef = useRef(false);

    // Debounced fetch from the Photon autocomplete endpoint
    const fetchSuggestions = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/geocode?city=${encodeURIComponent(query)}&autocomplete=true`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.suggestions || []);
                setOpen((data.suggestions || []).length > 0);
            }
        } catch {
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (skipNextFetchRef.current) {
            skipNextFetchRef.current = false;
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(value), 500);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [value, fetchSuggestions]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelect = (s: Suggestion) => {
        skipNextFetchRef.current = true;
        onChange(s.label);
        setSuggestions([]);
        setOpen(false);
        setSelectedIndex(-1);
        onSelect?.(s);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[selectedIndex]);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
            {label && <label htmlFor={id} className="input-label">{label}</label>}
            <div style={{ position: "relative" }}>
                <input
                    id={id}
                    className={`input-field ${className || ""}`}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={value}
                    onChange={e => { onChange(e.target.value); setSelectedIndex(-1); }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setOpen(true)}
                    placeholder={placeholder}
                    style={{ paddingRight: "2.5rem" }}
                />
                <div style={{
                    position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                    color: "var(--text-tertiary)", pointerEvents: "none", display: "flex", alignItems: "center",
                }}>
                    {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <MapPin size={14} />}
                </div>
            </div>

            {open && suggestions.length > 0 && (
                <div style={{
                    position: "absolute", zIndex: 9999, top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "var(--surface)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                }}>
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            onMouseDown={() => handleSelect(s)}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                padding: "0.65rem 0.85rem",
                                background: selectedIndex === i ? "var(--surface-hover, rgba(0,0,0,0.06))" : "transparent",
                                border: "none",
                                borderBottom: i < suggestions.length - 1 ? "1px solid var(--surface-border)" : "none",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "background 0.1s ease",
                            }}
                        >
                            <MapPin size={12} style={{ flexShrink: 0, color: "var(--text-tertiary)" }} />
                            <div style={{ flex: 1, overflow: "hidden" }}>
                                <div style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize: "0.82rem",
                                    fontWeight: 500,
                                    color: "var(--text-primary)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}>
                                    {s.label}
                                </div>
                                <div style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.52rem",
                                    color: "var(--text-tertiary)",
                                    letterSpacing: "0.05em",
                                    textTransform: "uppercase",
                                    marginTop: "1px",
                                }}>
                                    {s.lat.toFixed(4)}°, {s.lon.toFixed(4)}° · {s.type}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
