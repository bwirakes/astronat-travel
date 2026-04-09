# AstroNat Welcome Email Implementation Plan

This document outlines the final structure, styling, and integration strategy for the AstroNat greeting/welcome email, to be triggered after a user completes their payment and registration.

## 1. Vision & Voice

- **Persona**: An expert growing consultant for soul alignment.
- **Tone**: Succinct, high-authority, but with a sense of "Y2K magical" fun.
- **Copy Focus**: Highlighting specific features (Travel, Couples, Goals) as "unlocked modules" in their cosmic system.

## 2. Technical Stack

- **Provider**: [Resend](https://resend.com) (Node.js SDK)
- **API Key**: `RESEND_API_KEY` (Stored in environment variables)
- **Verification**: Ensure the `astronat.app` domain is verified on Resend for production use.
- **Trigger**: Post-payment webhook (Stripe `checkout.session.completed`) or registration completion.

## 3. Design System (Astro-Brand Alignment)

To match the existing project aesthetics, the email utilizes a custom HTML/CSS template:
- **Background**: Eggshell (`#F8F5EC`) for readability.
- **Container**: Charcoal (`#1B1B1B`) headers with a high-contrast white content block.
- **Typography**: Sans-serif (Helvetica/Arial) for universal email compatibility, but with bold, asymmetric header shapes.
- **Shapes**: Predefined `36px 4px 36px 4px` border-radius for an "Astro-Organic" feel.

## 4. Current Implementation

### Script: `scripts/send-welcome-email.mjs`
A reusable script that uses the Resend SDK to dispatch the onboarding email.

**Usage:**
```bash
bun scripts/send-welcome-email.mjs [recipient_email]
```

### Template Layout:
- **Header**: "ASTRONAT: SYSTEM ACCESS GRANTED" in a deep charcoal block.
- **Introduction**: "Your cosmic operating system is online."
- **Feature Grid**:
  - **Travel Astrology**: Highlights Astrocartography map exploration.
  - **Couples & Connection**: Highlights synastry and collective vibration.
  - **Life Goals**: Highlights alignment with planetary transits.
- **Call to Action**: High-fidelity Y2K Blue (`#0456fb`) button to the main dashboard.

## 5. Next Steps

1.  **Stripe Hook**: Integrate the `sendWelcomeEmail` function call into the `/api/stripe/webhook` route using the `customer_details.email` received from the session payload.
2.  **Domain Verification**: Transition the `from` email from `onboarding@resend.dev` to a verified address like `welcome@astronat.app` once the DNS setup is finalized.
3.  **A/B Testing**: Consider testing different subject lines (e.g., "The stars just aligned for you, {name}") to optimize open rates via Resend's dashboard.
