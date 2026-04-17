"use client";

import React, { useState, useEffect } from "react";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}
import { INTAKE_FORM_SECTIONS, type FormField, type FormSection } from "@/lib/marketing/data/intake-form";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FormValues = Record<string, string | string[]>;

// ─────────────────────────────────────────────────────────────────────────────
// Field components
// ─────────────────────────────────────────────────────────────────────────────

const colsClass = (n?: 2 | 3 | 4) => ({
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
})[n ?? 2] ?? "grid-cols-1 sm:grid-cols-2";

interface FieldProps {
  field: FormField;
  value: string | string[];
  onChange: (id: string, value: string | string[]) => void;
}

function TextField({ field, value, onChange }: FieldProps) {
  return (
    <input
      type={field.type}
      id={field.id}
      value={value as string}
      placeholder={field.placeholder}
      required={field.required}
      onChange={(e) => onChange(field.id, e.target.value)}
      style={{
        background: "transparent",
        borderBottom: "1px solid var(--form-input-border)",
        color: "var(--form-text)",
      }}
      className="w-full py-3 text-sm focus:outline-none transition-colors placeholder:opacity-40"
    />
  );
}

function TextareaField({ field, value, onChange }: FieldProps) {
  return (
    <textarea
      id={field.id}
      value={value as string}
      placeholder={field.placeholder}
      required={field.required}
      rows={field.rows ?? 4}
      onChange={(e) => onChange(field.id, e.target.value)}
      style={{
        background: "var(--form-textarea-bg)",
        border: "1px solid var(--form-input-border)",
        color: "var(--form-text)",
      }}
      className="w-full p-4 text-sm focus:outline-none transition-colors resize-none placeholder:opacity-40"
    />
  );
}

function OptionBox({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && onClick()}
      style={
        selected
          ? {
              background: "var(--form-option-selected-bg)",
              borderColor: "var(--form-option-selected-border)",
              color: "var(--form-option-selected-text)",
            }
          : {
              background: "var(--form-option-bg)",
              borderColor: "var(--form-border)",
              color: "var(--form-text)",
            }
      }
      className="flex items-start gap-3 p-4 border cursor-pointer transition-all text-sm shadow-sm hover:opacity-90"
    >
      {children}
    </div>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      style={{
        borderColor: selected ? "var(--form-option-selected-text)" : "var(--form-radio-border)",
        flexShrink: 0,
      }}
      className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center"
    >
      {selected && (
        <span
          style={{ background: "var(--form-option-selected-text)" }}
          className="w-2 h-2 rounded-full"
        />
      )}
    </span>
  );
}

function CheckDot({ selected }: { selected: boolean }) {
  return (
    <span
      style={{
        borderColor: selected ? "var(--form-option-selected-text)" : "var(--form-radio-border)",
        background: selected ? "var(--form-option-selected-text)" : "transparent",
        flexShrink: 0,
      }}
      className="mt-0.5 w-4 h-4 border-2 flex items-center justify-center"
    >
      {selected && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="var(--form-option-selected-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function RadioField({ field, value, onChange }: FieldProps) {
  const [otherValue, setOtherValue] = useState("");
  const selected = value as string;
  const isOtherSelected = selected === "__other__";

  return (
    <div className={`grid gap-2 ${colsClass(field.columns)}`}>
      {field.options?.map((opt) => (
        <OptionBox key={opt} selected={selected === opt} onClick={() => onChange(field.id, opt)}>
          <RadioDot selected={selected === opt} />
          <span className="leading-snug">{opt}</span>
          <input type="radio" name={field.id} value={opt} checked={selected === opt} onChange={() => onChange(field.id, opt)} className="sr-only" required={field.required} />
        </OptionBox>
      ))}
      {field.hasOther && (
        <OptionBox selected={isOtherSelected} onClick={() => onChange(field.id, "__other__")}>
          <RadioDot selected={isOtherSelected} />
          <span className="leading-snug">Other</span>
          <input type="radio" name={field.id} value="__other__" checked={isOtherSelected} onChange={() => onChange(field.id, "__other__")} className="sr-only" />
        </OptionBox>
      )}
      {isOtherSelected && (
        <div className="col-span-full mt-1">
          <input
            type="text"
            placeholder="Please specify..."
            value={otherValue}
            onChange={(e) => {
              setOtherValue(e.target.value);
              onChange(field.id, `Other: ${e.target.value}`);
            }}
            style={{ borderBottom: "1px solid var(--form-input-border)", color: "var(--form-text)" }}
            className="w-full bg-transparent py-2 text-sm focus:outline-none transition-colors placeholder:opacity-40"
          />
        </div>
      )}
    </div>
  );
}

function CheckboxField({ field, value, onChange }: FieldProps) {
  const selected = (value as string[]) || [];
  const [otherValue, setOtherValue] = useState("");
  const isOtherSelected = selected.includes("__other__");

  const toggle = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter((v) => v !== opt)
      : [...selected, opt];
    onChange(field.id, next);
  };

  return (
    <div>
      <div className={`grid gap-2 ${colsClass(field.columns)}`}>
        {field.options?.map((opt) => (
          <OptionBox key={opt} selected={selected.includes(opt)} onClick={() => toggle(opt)}>
            <CheckDot selected={selected.includes(opt)} />
            <span className="leading-snug">{opt}</span>
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="sr-only" />
          </OptionBox>
        ))}
        {field.hasOther && (
          <OptionBox selected={isOtherSelected} onClick={() => toggle("__other__")}>
            <CheckDot selected={isOtherSelected} />
            <span className="leading-snug">Other</span>
            <input type="checkbox" checked={isOtherSelected} onChange={() => toggle("__other__")} className="sr-only" />
          </OptionBox>
        )}
      </div>
      {isOtherSelected && (
        <div className="mt-3">
          <input
            type="text"
            placeholder="Please specify..."
            value={otherValue}
            onChange={(e) => {
              setOtherValue(e.target.value);
              const withoutOld = selected.filter((v) => !v.startsWith("Other:") && v !== "__other__");
              onChange(field.id, [...withoutOld, `Other: ${e.target.value}`]);
            }}
            style={{ borderBottom: "1px solid var(--form-input-border)", color: "var(--form-text)" }}
            className="w-full bg-transparent py-2 text-sm focus:outline-none transition-colors placeholder:opacity-40"
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section component
// ─────────────────────────────────────────────────────────────────────────────

function SectionBlock({
  section,
  values,
  onChange,
  sectionIndex,
}: {
  section: FormSection;
  values: FormValues;
  onChange: (id: string, value: string | string[]) => void;
  sectionIndex: number;
}) {
  return (
    <div
      style={{ borderBottom: "1px solid var(--form-section-border)" }}
      className="py-16 md:py-20"
    >
      {/* Full-width section header */}
      <div
        style={{ borderBottom: "1px solid var(--form-section-border)" }}
        className="mb-12 pb-10 text-center"
      >
        <div
          style={{ color: "var(--color-y2k-blue)" }}
          className="font-mono text-[9px] uppercase tracking-[0.22em] mb-4 flex items-center justify-center gap-2"
        >
          <span style={{ background: "var(--color-y2k-blue)" }} className="inline-block w-4 h-px" />
          {section.kicker}
        </div>
        <h2
          style={{ color: "var(--form-text)" }}
          className="font-primary text-4xl md:text-6xl lg:text-7xl uppercase leading-none"
        >
          {section.heading}{" "}
          <em className="font-secondary normal-case italic text-[var(--color-spiced-life)]">
            {section.headingAccent}
          </em>
        </h2>
        <div
          style={{ color: "var(--form-text-faint)" }}
          className="font-mono text-[10px] uppercase tracking-widest mt-4"
        >
          {String(sectionIndex + 1).padStart(2, "0")} / 07
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-10 max-w-3xl mx-auto">
        {section.fields.map((field) => (
          <div key={field.id}>
            <label
              htmlFor={field.type !== "radio" && field.type !== "checkbox" ? field.id : undefined}
              style={{ color: "var(--form-text)" }}
              className="block font-body text-sm font-medium mb-1"
            >
              {field.label}
              {field.required && (
                <sup className="text-[var(--color-spiced-life)] ml-0.5">*</sup>
              )}
            </label>
            {field.hint && (
              <p style={{ color: "var(--form-text-muted)" }} className="font-body text-xs mb-3 leading-relaxed">
                {field.hint}
              </p>
            )}
            {(field.type === "text" || field.type === "email" || field.type === "tel") && (
              <TextField field={field} value={values[field.id] ?? ""} onChange={onChange} />
            )}
            {field.type === "textarea" && (
              <TextareaField field={field} value={values[field.id] ?? ""} onChange={onChange} />
            )}
            {field.type === "radio" && (
              <RadioField field={field} value={values[field.id] ?? ""} onChange={onChange} />
            )}
            {field.type === "checkbox" && (
              <CheckboxField field={field} value={values[field.id] ?? []} onChange={onChange} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main form block
// ─────────────────────────────────────────────────────────────────────────────

type SubmitStatus = "idle" | "loading" | "success" | "error";

export function IntakeFormBlock() {
  const [values, setValues] = useState<FormValues>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Load reCAPTCHA v3 script once on mount (production only)
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || document.getElementById("recaptcha-v3-script")) return;
    const script = document.createElement("script");
    script.id = "recaptcha-v3-script";
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  const handleChange = (id: string, value: string | string[]) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    setStatus("loading");
    setErrorMsg("");

    try {
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      let captchaToken: string = "no-captcha";
      if (process.env.NODE_ENV !== "production") {
        captchaToken = "dev-bypass";
      } else if (siteKey && window.grecaptcha?.execute) {
        try {
          captchaToken = await new Promise<string>((resolve, reject) => {
            window.grecaptcha.ready(async () => {
              try {
                resolve(await window.grecaptcha.execute(siteKey, { action: "submit" }));
              } catch (e) {
                reject(e);
              }
            });
          });
        } catch {
          captchaToken = "no-captcha";
        }
      }

      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, _captcha: captchaToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Submission failed");
      }

      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message ?? "Something went wrong. Please try again.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  if (status === "success") {
    return (
      <div
        style={{ background: "var(--form-bg)" }}
        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-24"
      >
        <div
          style={{ color: "var(--color-y2k-blue)" }}
          className="font-mono text-[9px] uppercase tracking-[0.22em] mb-6 flex items-center gap-2 justify-center"
        >
          <span style={{ background: "var(--color-y2k-blue)" }} className="inline-block w-4 h-px" />
          Received
        </div>
        <h2
          style={{ color: "var(--form-text)" }}
          className="font-primary text-4xl md:text-6xl uppercase leading-none mb-6"
        >
          Thank You.
        </h2>
        <p style={{ color: "var(--form-text-muted)" }} className="font-body text-sm md:text-base max-w-md leading-relaxed">
          Your intake has been received. Nat will review your brief and be in touch within 48 hours to arrange your initial consultation.
        </p>
        <div style={{ color: "var(--form-text-faint)" }} className="mt-10 font-mono text-[9px] uppercase tracking-widest">
          🔒 Protected under full NDA · AstroNat Corporate Intelligence · Singapore
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div
        style={{ background: "var(--form-bg)" }}
        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-24"
      >
        <div
          style={{ color: "var(--color-y2k-blue)" }}
          className="font-mono text-[9px] uppercase tracking-[0.22em] mb-8 flex items-center gap-2 justify-center"
        >
          <span style={{ background: "var(--color-y2k-blue)" }} className="inline-block w-4 h-px" />
          Submitting
        </div>
        {/* Animated dots */}
        <div className="flex items-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                background: "var(--form-text)",
                animationDelay: `${i * 0.2}s`,
              }}
              className="w-2 h-2 rounded-full animate-bounce"
            />
          ))}
        </div>
        <p style={{ color: "var(--form-text-muted)" }} className="font-body text-sm max-w-xs leading-relaxed">
          Sending your brief to Nat. This may take a moment — please don't close this page.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--form-bg)" }}>
      {/* Hero header */}
      <div
        style={{ borderBottom: "1px solid var(--form-section-border)" }}
        className="max-w-7xl mx-auto px-6 pt-16 pb-8"
      >
        <div
          style={{ color: "var(--color-y2k-blue)" }}
          className="font-mono text-[9px] uppercase tracking-[0.22em] mb-6 flex items-center gap-2"
        >
          <span style={{ background: "var(--color-y2k-blue)" }} className="inline-block w-4 h-px" />
          Corporate Intelligence · Client Intake
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-10 items-end">
          <div>
            <h1
              style={{ color: "var(--form-text)" }}
              className="font-primary text-5xl md:text-7xl uppercase leading-[0.85]"
            >
              Corporate{" "}
              <em className="font-secondary italic normal-case text-[var(--color-spiced-life)]">
                Intake
              </em>
              <br />
              Brief
            </h1>
          </div>
          <p style={{ color: "var(--form-text-muted)" }} className="font-body text-sm leading-relaxed">
            Complete this brief so we can map your incorporation chart against your strategic objectives before our first conversation. All information is held under full NDA.
          </p>
        </div>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="max-w-7xl mx-auto px-6">
          {INTAKE_FORM_SECTIONS.map((section, i) => (
            <SectionBlock
              key={section.id}
              section={section}
              values={values}
              onChange={handleChange}
              sectionIndex={i}
            />
          ))}
        </div>

        {/* Submit */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div
            style={{ borderTop: "1px solid var(--form-section-border)" }}
            className="pt-12 flex flex-col items-center gap-4"
          >
            {status === "error" && (
              <p className="text-xs text-red-500 font-mono">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                background: "var(--form-submit-bg)",
                color: "var(--form-submit-text)",
              }}
              className="px-16 py-5 font-mono text-[10px] uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Submitting..." : "Submit Intake Brief →"}
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--form-bg)",
              border: "1px solid var(--form-section-border)",
            }}
            className="w-full max-w-md p-10 flex flex-col gap-6"
          >
            <div
              style={{ color: "var(--color-y2k-blue)" }}
              className="font-mono text-[9px] uppercase tracking-[0.22em] flex items-center gap-2"
            >
              <span style={{ background: "var(--color-y2k-blue)" }} className="inline-block w-4 h-px" />
              Before You Submit
            </div>
            <h3
              style={{ color: "var(--form-text)" }}
              className="font-primary text-3xl uppercase leading-none"
            >
              Ready to<br />
              <em className="font-secondary italic normal-case text-[var(--color-spiced-life)]">submit?</em>
            </h3>
            <p style={{ color: "var(--form-text-muted)" }} className="font-body text-sm leading-relaxed">
              By submitting this brief you agree to our standard confidentiality terms. All information shared is held under full NDA.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmSubmit}
                style={{
                  background: "var(--form-submit-bg)",
                  color: "var(--form-submit-text)",
                }}
                className="flex-1 py-4 font-mono text-[10px] uppercase tracking-widest hover:opacity-80 transition-opacity"
              >
                Confirm &amp; Submit →
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  border: "1px solid var(--form-border)",
                  color: "var(--form-text-muted)",
                }}
                className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest hover:opacity-60 transition-opacity"
              >
                Cancel
              </button>
            </div>
            <div style={{ color: "var(--form-text-faint)" }} className="font-mono text-[9px] uppercase tracking-widest">
              🔒 Protected by full NDA · AstroNat Corporate Intelligence · Singapore
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
