# Adera Hybrid App — Project Overview

**Project**: Adera Hybrid App  
**Organization**: MBET Digital Solutions  
**Market**: Addis Ababa, Ethiopia  
**Repository**: adera-hybrid-app (branch: dev)  
**Status**: Active development — Phase 1 stabilization complete  

## What It Is

A dual-purpose platform combining:
1. **Adera-PTP** — Peer-to-peer parcel delivery with QR-based tracking
2. **Adera-Shop** — E-commerce marketplace for local partner shops

Both apps live in a single Expo/React Native monorepo and share common packages.

## Key Facts

- **Framework**: Expo SDK 54 + React Native 0.81
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **State**: Zustand
- **UI**: React Native Paper (Material 3) with Ethiopian-inspired palette
- **Package Manager**: npm workspaces + Turborepo
- **Branches**: main (production), stable (staging), dev (active development)

## Current Phase

Phase 1 — Architecture stabilization and cleanup:
- ✅ Broken package imports fixed (payments, localization, utils stubs)
- ✅ Database schema consolidated (users table merged)
- ✅ Dead code removed
- ✅ Safe area and bottom nav overlap fixed
- ⬜ Memory bank rebuilt
- ⬜ Build verification
