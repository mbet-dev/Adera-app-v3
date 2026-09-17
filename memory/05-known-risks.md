# Known Risks and Issues

## Resolved (Phase 1)
- ✅ Broken package imports (`@adera/payments`, `@adera/localization`, `@adera/utils`)
- ✅ Dual `users`/`profiles` tables causing data mismatch
- ✅ Duplicate SQL type definitions
- ✅ Bottom nav overlap on Profile and other tab screens
- ✅ Aggressive safe area padding causing notch overflow
- ✅ `WebStabilityWrapper` MutationObserver anti-pattern
- ✅ Auth store not tracking `last_login_at`

## Active Risks

### High
- **No automated tests**: Zero test files. Any refactoring carries regression risk.
- **No CI/CD pipeline**: Manual deployment is error-prone.

### Medium
- **Wallet system undefined**: Dashboard shows wallet but no database table or funding flow.
- **No push notifications**: Critical for parcel status engagement.
- **No SMS integration**: Recipient notification for parcel pickup is core workflow.
- **Shop cross-import coupling**: PTP ShopNavigator imports directly from `apps/adera-shop/` — tight coupling.

### Low
- **No TypeScript**: All `.js` source. Type errors only surface at runtime.
- **3G performance**: App targets Ethiopian 3G but no visible bundle optimization.
- **Environment secrets**: `.env.example` contains real-looking API keys.

## Open Questions
- Should wallet system be implemented before or after payment gateway?
- Should `apps/adera-shop/` be refactored to be fully independent, or is the cross-import acceptable?
- What is the priority order for push notifications vs SMS?
