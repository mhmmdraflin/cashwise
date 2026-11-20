---
name: vercel
description: "Workflows for managing and deploying CashWise Web application to Vercel, including build checks, environment configuration, and deployments."
allowed-tools: Read Write Edit Glob Grep
---

# Vercel Deployment & Workflow Skill

## Overview
Panduan operasi deployment aplikasi Web CashWise ke Vercel menggunakan Vercel CLI atau GitHub Integration.

## Deployment Checklist
1. **Verifikasi Build Lokal:**
   ```bash
   cd apps/web && npm run build
   ```
2. **Environment Variables:**
   Pastikan variabel lingkungan pada Vercel Dashboard atau `.env.production` terisi:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_API_URL`
3. **Deployment via Vercel CLI:**
   - Preview deployment:
     ```bash
     vercel
     ```
   - Production deployment:
     ```bash
     vercel --prod
     ```
4. **Header Keamanan & Optimasi:**
   - Pastikan caching headers pada aset statis dikonfigurasi optimal.
   - Konfigurasi CORS pada `/api/*` untuk mengizinkan request dari aplikasi mobile.
