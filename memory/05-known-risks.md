# Known Risks and Issues

## Resolved (Phase 1-3)
- ✅ Broken package imports (`@adera/payments`, `@adera/localization`, `@adera/utils`)
- ✅ Dual `users`/`profiles` tables causing data mismatch
- ✅ Duplicate SQL type definitions
- ✅ Bottom nav overlap on Profile and other tab screens
- ✅ Aggressive safe area padding causing notch overflow
- ✅ `WebStabilityWrapper` MutationObserver anti-pattern
- ✅ Auth store not tracking `last_login_at`
- ✅ Chapa payment wired into CreateParcel and Shop Checkout

## Active Risks

### High
- **No automated tests**: Zero test files. Any refactoring carries regression risk. (Latest: 87 tests exist in 4 suites)
- **No CI/CD pipeline**: Manual deployment is error-prone. (Latest: GitHub Actions CI in place)

### Medium
- **Wallet system**: SQL tables + functions exist (supabase/10-wallet-system.sql) but migration not deployed to live DB; UI flow (top-up, transaction history) not implemented.
- **No push notifications**: Critical for parcel status engagement. (Latest: Phase 6 complete — Expo Push + Supabase notifications)
- **No SMS integration**: Recipient notification for parcel pickup is core workflow.
- **Shop cross-import coupling**: PTP ShopNavigator imports directly from `apps/adera-shop/` — tight coupling.
- **CHAPA_SECRET_KEY not set**: Edge Function exists but secret not configured in Supabase.

### Low
- **No TypeScript**: All `.js` source. Type errors only surface at runtime.
- **3G performance**: App targets Ethiopian 3G but no visible bundle optimization.
- **Environment secrets**: `.env.example` contains real-looking API keys.

## Open Questions
- Should wallet system be implemented before or after payment gateway?
- Should `apps/adera-shop/` be refactored to be fully independent, or is the cross-import acceptable?
- What is the priority order for push notifications vs SMS?
