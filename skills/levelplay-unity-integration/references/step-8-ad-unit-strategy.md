# 8. Recommend Ad Unit Strategy

Based on the optimization goal identified in Step 2, recommend an ad unit strategy.

**Recall the user's optimization goal from Step 2.** If the conversation has been long or the answer is unclear, confirm: "Earlier you mentioned your optimization goal. To confirm, are you primarily focused on revenue, user experience, or a balance of both?"

**Map the answer to a strategy** and give a brief recommendation (full detail, benchmarks, and placement guidance are in `references/best-practices.md` under "Ad Format Strategy by Goal"):

- **Revenue-focused** → **Revenue Strategy.** Rewarded (primary monetization, multiple high-value moments) → Interstitial (secondary; at transitions; frequency cap 3–5 min) → Banner (persistent during gameplay). Bid floors are an optional revenue lever configured in Step 9. Implementation priority: **Rewarded → Interstitial → Banner**.
- **UX-focused** → **UX Strategy.** Rewarded only, user-initiated (explicit opt-in), high-value rewards, **no forced ads, ever**. Interstitials optional/sparingly at session boundaries only; banners generally avoided or menu-only. Implementation priority: **Rewarded only, or Rewarded → (optional) Interstitial**.
- **Balanced** → **Balanced Strategy.** Rewarded (2–3 strategic placements) → Interstitial (moderate; natural breakpoints; frequency cap 5–7 min) → Banner (selective; menus/low-attention). Implementation priority: **Rewarded → Interstitial → Banner (selective)**.
- **"Not sure yet"** (from Step 2) → use the **Balanced Strategy**, then add: "Since you weren't sure of your goal earlier, I've gone with the Balanced approach — if you'd prefer to lean more toward revenue or user experience now that you've seen the options, just say so."
- If still unclear, ask: "Would you prioritize revenue, user experience, or a balance of both?"

The next step asks which ad formats to implement from this priority list. If the user wants a different order than recommended, accommodate that preference.

