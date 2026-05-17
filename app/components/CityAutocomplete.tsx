"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AlertCircle, CheckCircle2, Loader2, MapPin, Search } from "lucide-react";

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
    onUseTypedCity?: (value: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    id?: string;
}

export default function CityAutocomplete({
    value,
    onChange,
    onSelect,
    onUseTypedCity,
    placeholder = "e.g. Jakarta, Indonesia",
    label,
    className,
    id,
}: CityAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lookupError, setLookupError] = useState("");
    const [lastQuery, setLastQuery] = useState("");
    const [selectedLabel, setSelectedLabel] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // Suppresses the next fetch after a programmatic value change from handleSelect,
    // otherwise the value-watching effect re-opens the dropdown right after a pick.
    const skipNextFetchRef = useRef(false);

    // Debounced fetch from the Photon autocomplete endpoint
    const fetchSuggestions = useCallback(async (query: string) => {
        const trimmed = query.trim();
        setLastQuery(trimmed);
        if (trimmed.length < 2) {
            setSuggestions([]);
            setLookupError("");
            setOpen(false);
            return;
        }
        setLoading(true);
        setLookupError("");
        try {
            const res = await fetch(`/api/geocode?city=${encodeURIComponent(trimmed)}&autocomplete=true`);
            if (!res.ok) {
                throw new Error("lookup_failed");
            }
            const data = await res.json();
            const nextSuggestions = data.suggestions || [];
            setSuggestions(nextSuggestions);
            setOpen(true);
        } catch {
            setSuggestions([]);
            setLookupError("We could not search cities right now.");
            setOpen(true);
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
        setSelectedLabel(s.label);
        setLookupError("");
        onChange(s.label);
        setSuggestions([]);
        setOpen(false);
        setSelectedIndex(-1);
        onSelect?.(s);
    };

    const handleUseTypedCity = () => {
        const typed = value.trim();
        if (!typed) return;
        setSelectedLabel("");
        setSuggestions([]);
        setLookupError("");
        setOpen(false);
        setSelectedIndex(-1);
        onUseTypedCity?.(typed);
    };

    const retryLookup = () => {
        void fetchSuggestions(lastQuery || value);
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
                    onChange={e => { setSelectedLabel(""); onChange(e.target.value); setSelectedIndex(-1); }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (value.trim().length >= 2 && (suggestions.length > 0 || lookupError)) setOpen(true);
                    }}
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

            {value.trim().length >= 2 && !open && !loading && (
                <div style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    marginTop: "0.35rem",
                    fontFamily: "var(--font-mono)", fontSize: "0.55rem",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    color: selectedLabel === value ? "var(--sage)" : "var(--text-tertiary)",
                }}>
                    {selectedLabel === value ? <CheckCircle2 size={12} /> : <Search size={12} />}
                    {selectedLabel === value ? "Matched city coordinates" : "Typed city - coordinates will be confirmed"}
                </div>
            )}

            {open && (
                <div style={{
                    position: "absolute", zIndex: 9999, top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "var(--surface)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                }}>
                    {loading ? (
                        <div style={{ padding: "0.85rem", display: "flex", gap: "0.55rem", alignItems: "center", color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "0.78rem" }}>
                            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                            Searching cities...
                        </div>
                    ) : lookupError ? (
                        <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                            <div style={{ display: "flex", gap: "0.55rem", alignItems: "flex-start", color: "var(--color-spiced-life)" }}>
                                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 600 }}>
                                        City search failed
                                    </div>
                                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                                        {lookupError} Retry, or keep your typed city and we&apos;ll resolve it when you continue.
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); retryLookup(); }} style={dropdownActionStyle}>
                                    Retry
                                </button>
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); handleUseTypedCity(); }} style={dropdownActionStyle}>
                                    Use typed city
                                </button>
                            </div>
                        </div>
                    ) : suggestions.length === 0 && !loading ? (
                        <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                            <div style={{ display: "flex", gap: "0.55rem", alignItems: "flex-start" }}>
                                <Search size={14} style={{ flexShrink: 0, marginTop: 2, color: "var(--text-tertiary)" }} />
                                <div>
                                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                                        No city matches found
                                    </div>
                                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                                        Check spelling or use the typed city. Exact matches give the highest coordinate confidence.
                                    </div>
                                </div>
                            </div>
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); handleUseTypedCity(); }} style={dropdownActionStyle}>
                                Use typed city
                            </button>
                        </div>
                    ) : suggestions.map((s, i) => (
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

const dropdownActionStyle: React.CSSProperties = {
    border: "1px solid var(--surface-border)",
    borderRadius: "var(--radius-full)",
    background: "transparent",
    color: "var(--text-primary)",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.4rem 0.75rem",
};
