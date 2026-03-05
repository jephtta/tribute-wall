# Tribute Wall

A web application that lets anyone create a shareable, dedicated page to celebrate or honor a person — for birthdays, retirements, memorials, weddings, graduations, or any meaningful milestone.

## Live URL

<https://tribute-wall-cgjawpkxua-uc.a.run.app>

## Features

- **Wall Creation** — Set up a tribute page with title, cover image, description, and tone (Celebration or In Memoriam)
- **Frictionless Contributions** — Anyone with the link can leave tributes with text and media — no account required
- **Moderation** — Wall creators can approve, pin, or delete tributes
- **Reactions** — Heart/like system with animated counters
- **Sharing** — Unique URLs, QR codes, and share buttons for WhatsApp and email
- **Gallery** — Creator-curated photo and video showcase with masonry layout

## Prerequisites

- Node.js 20+
- A Firebase project with Firestore, Auth (Google + Email/Password), and Storage enabled
- A Google Cloud account (for Cloud Run deployment)

## Tech Stack

- **Framework**: Next.js (App Router) + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth
- **Hosting**: Google Cloud Run
- **Tests**: Playwright

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` with:

```bash
# Firebase client config — from Firebase Console > Project Settings > General
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin — from Firebase Console > Project Settings > Service Accounts
# Paste the entire JSON key as a single line
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

If running on a machine with `gcloud auth application-default login`, the service account key is optional.

## Testing

```bash
npx playwright install --with-deps
npx playwright test
```

## License

Private
