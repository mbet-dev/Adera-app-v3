# Active Context - Adera Hybrid App Development

**Date**: 2025-10-21  
**Status**: Customer app stabilized — preparing multi-app routing overhaul  
**Current Branch**: dev  
**Active Focus**: UI polish (parcel history, theming) + documentation ahead of repo hardening

## Current Work Context

### Primary Focus
- **PTP Experience Hardening**: Resolve residual blank screens and layout gaps on customer flows
- **Theme Preferences**: Ship persisted light/dark/system toggle spanning web & native
- **Documentation & Changelog**: Record resolutions in `.adera/memory/` and `.adera/changelogs/`

### Recent Progress
- ✅ `packages/ui/src/BottomNavigation.js` patched to allocate scene height, lifting blank customer screens
- ✅ Fixed web blank screen regression (MD3LightTheme/MD3DarkTheme imports)
- ✅ Created `packages/preferences/` with theme, language, and biometric persistence
- ✅ Integrated theme mode toggle in Profile screen (System/Light/Dark)
- ✅ Added biometric login button to LoginScreen with hardware detection
- ✅ Restored onboarding flow on app launch and after sign-out
- ✅ Enhanced parcel history card layout to prevent overflow

### Immediate Next Steps
1. **Install Dependencies**: Run `pnpm install` to sync new packages (@adera/preferences, biometric libs)
2. **Verify on Web & Native**: Test theme persistence, biometric toggle, onboarding flow
3. **Testing & Push**: Run lint/tests, then push to `dev`, `main`, and `Rsv/v4`
4. **Guest Mode Navigation**: Implement shop browsing without authentication
5. **Multi-App Router**: Refactor root to redirect PTP vs Shop based on user choice/role

## Active Decisions & Considerations

### Technology Choices Confirmed
- **Expo SDK**: Targeting version 54 (latest stable for production)
- **React Native**: Version 0.81.4 (compatible with Expo 54)
- **Design System**: Material 3 with Ethiopian cultural elements
- **State Management**: TBD (Zustand vs Redux Toolkit)

### Architecture Patterns
- **Monorepo**: Turborepo with pnpm workspaces
- **Shared Packages**: UI/auth ready; upcoming preferences module for cross-app settings
- **Role-Based Access**: Current focus on customer; next milestone includes unified router for PTP + Shop

### UX Decisions
- **Onboarding Flow**: 4-slide introduction with Ethiopian market imagery
- **App Selection**: Selector to be reinstated post sign-out as part of session reset improvements
- **Guest Mode**: Browse-first remains; upcoming work ensures role-based redirects from root app

## Next Steps

### Phase 1: Foundation Stabilization (Current)
1. Fix all version inconsistencies
2. Install missing dependencies
3. Verify build system works across all packages
4. Complete basic UI component library

### Phase 2: Core Services Setup
1. Set up Supabase project and database schema
2. Implement authentication package
3. Create role-based routing system
4. Set up localization framework

### Phase 3: Feature Implementation
1. Build PTP parcel creation and tracking
2. Implement Shop marketplace functionality
3. Integrate payment gateways
4. Add notifications system

## Open Questions
- Should we use Zustand or Redux Toolkit for state management?
- What's the preferred approach for offline-first architecture?
- How should we handle image optimization for Ethiopian 3G constraints?
- Should we implement a unified design token system?

## Quality Gates
- All packages must use consistent dependency versions
- Every component must follow Material 3 design principles
- Ethiopian cultural elements must be authentically represented
- Performance budget: 150MB RAM, 3G-optimized
