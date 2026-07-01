# AmazeCC Dashboard

<p align="center">
  <img src="public/icons/AmazeCC.png" width="300" alt="AmazeCC Dashboard">
</p>

<p align="center">
  <strong>A modern student dashboard for VIT Chennai — the "Student OS"</strong>
</p>

<p align="center">
  <a href="https://admin.amazecc.com"><strong>Live Site</strong></a> ·
  <a href="https://github.com/AmazeContinuityProjects/AmazeCC-Dashboard/issues"><strong>Report Bug</strong></a> ·
  <a href="https://github.com/AmazeContinuityProjects/AmazeCC-Dashboard/issues"><strong>Request Feature</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/AmazeContinuityProjects/AmazeCC-Dashboard?style=flat-square&label=License" alt="License">
  <img src="https://img.shields.io/github/last-commit/AmazeContinuityProjects/AmazeCC-Dashboard/main?style=flat-square&label=Last%20Commit" alt="Last Commit">
  <img src="https://img.shields.io/github/repo-size/AmazeContinuityProjects/AmazeCC-Dashboard?style=flat-square&label=Repo%20Size&color=blueviolet" alt="Repo Size">
  <br>
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
</p>

> **Note:** This project is not affiliated with VIT or VTOP. It is a third-party convenience layer built for students.

---

## Features

| Category | Features |
|----------|----------|
| **VTOP Integration** | Login with VTOP credentials; automatic attendance, grades, timetable, exam schedule, and hostel data scraping |
| **Attendance Dashboard** | Subject-wise attendance, calendar/heat map views, OD tracker, attendance predictor |
| **Academics Hub** | Semester-wise grades, CGPA, marks, GPA predictor, curriculum viewer, FFCS timetable |
| **Hostel Module** | Mess menu, laundry slots, leave management |
| **Dayscholar Module** | Bus route finder with boarding points, bus fees |
| **Q-Bank** | Past papers archive, question browser, OCR pipeline for digitizing PDFs, admin review queue |
| **Social Features** | Share/import timetables via QR code, overlay friend schedules, find common free slots |
| **Moodle/LMS Sync** | Fetch assignments and deadlines from Moodle |
| **VITOL Notifications** | Online class schedules with push notification reminders |
| **Admin Panel** | User management, Q-Bank OCR pipeline, diagrams, storage, audit logs, push broadcasts |
| **File Upload** | Temporary file sharing via Backblaze B2 (auto-delete after 24h) |
| **PWA** | Installable, offline-capable, push notifications |
| **Theme System** | Dark/light mode with accent themes (Ocean, Forest, Lavender, Sunset) |
| **Calendar View** | Combined academic calendar, Moodle deadlines, OD hours, and timetable overlay |

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | TailwindCSS v4, Radix UI, Framer Motion, Lucide icons |
| **State & Data** | SWR, Jotai |
| **Charts** | Recharts, react-circular-progressbar, react-heat-map |
| **Backend Storage** | Supabase (PostgreSQL), Backblaze B2 (S3) |
| **PWA** | Serwist (service worker), Web Push API (VAPID) |
| **OCR** | Ollama-based worker (Qwen 2.5VL / Moondream) |
| **Deploy** | Vercel, Netlify, Cloudflare Pages, GitHub Pages |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (for auth, DB, and storage)
- A UniCC API backend ([repository](https://github.com/SugeethJSA/UniCC))

### Installation

```bash
git clone https://github.com/AmazeContinuityProjects/AmazeCC-Dashboard.git
cd AmazeCC-Dashboard
pnpm install
```

### Environment Variables

Create a `.env` file (see `.env.example`):

```env
ADMIN_PASSWORD="your_admin_password_here"
DATABASE_URL="postgresql://user:password@host:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL=https://your_project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
NEXT_PUBLIC_API_BASE=http://localhost:3005
ADMIN_VTOP_IDS=ADMIN_ID_1,ADMIN_ID_2
```

### Development

```bash
pnpm dev
```

Starts the dev server on **<https://localhost:3002>** (with HTTPS).

### Build

```bash
pnpm build
```

Produces a static export in the `out/` directory.

---

## Deployment

| Platform | Notes |
|----------|-------|
| **Vercel** | Default config via `vercel.json` |
| **Netlify** | Via `netlify.toml` (requires `@netlify/plugin-nextjs`) |
| **Cloudflare Pages** | Via `open-next.config.ts` with `@opennextjs/cloudflare` |
| **GitHub Pages** | CI workflow builds and deploys `./out` |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Main app entry (login → dashboard)
│   ├── admin/              # Admin portal
│   ├── upload/             # File upload page
│   └── sw.ts               # Service worker
├── components/
│   ├── custom/
│   │   ├── attendance/     # Attendance, calendar, timetable, OD tracker
│   │   ├── Exams/          # Academics, grades, marks, GPA predictor, Moodle
│   │   ├── Hostel/         # Mess, laundry, leave
│   │   ├── dayscholar/     # Bus finder, fees, admin dashboard
│   │   ├── social/         # QR sharing, friend timetable, free slots
│   │   ├── qbank/          # Papers, questions, OCR upload, admin review
│   │   └── admin/          # Admin panel components
│   └── ui/                 # Radix-based UI primitives
├── data/                   # Static data (quick links, buses, changelog)
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, API client, auth
└── types/                  # TypeScript type definitions
```

---

## Backend API

This dashboard requires the **UniCC API** backend for VTOP data scraping:

- **Repository:** [github.com/SugeethJSA/UniCC](https://github.com/SugeethJSA/UniCC)
- **Hosted API:** `https://uniccapi.uni-cc.site`
- **API Docs:** `https://api.uni-cc.site/docs`

Set `NEXT_PUBLIC_API_BASE` in your `.env` to point to your backend instance.

---

## Contributing

Contributions are welcome! Please read our [Code of Conduct](CODE_OF_CONDUCT.md) and submit a pull request.

---

## License

[MIT](LICENSE)

---

## Contributors

<p align="center">
  <a href="https://github.com/SugeethJSA"><img src="https://img.shields.io/badge/SugeethJSA-000?style=for-the-badge&logo=github&logoColor=white" alt="SugeethJSA"></a>
  <a href="https://github.com/dhivyanj"><img src="https://img.shields.io/badge/dhivyanj-000?style=for-the-badge&logo=github&logoColor=white" alt="dhivyanj"></a>
</p>
