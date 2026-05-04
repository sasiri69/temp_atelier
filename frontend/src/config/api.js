// ─────────────────────────────────────────────────────────────────────────────
// Central API configuration
//
// FOR LOCAL DEVELOPMENT:
//   Falls back to your LAN IP (change 192.168.1.24 to your PC's IP if needed).
//   Run `ipconfig` on Windows to find your IPv4 address.
//
// FOR PRODUCTION / HOSTING:
//   Set EXPO_PUBLIC_API_URL in a .env file at the frontend root:
//   EXPO_PUBLIC_API_URL=https://your-backend.onrender.com
//   or EXPO_PUBLIC_API_URL=https://your-backend.railway.app
//   This env var is automatically picked up by Expo at build time.
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.24:5000';
