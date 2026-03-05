# Tribute Wall

A web application that lets anyone create a shareable, dedicated page to celebrate or honor a person — for birthdays, retirements, memorials, weddings, graduations, or any meaningful milestone.

## Features

- **Wall Creation** — Set up a tribute page with title, cover image, description, and tone (Celebration or In Memoriam)
- **Frictionless Contributions** — Anyone with the link can leave tributes with text and media — no account required
- **Moderation** — Wall creators can approve, pin, or delete tributes
- **Reactions** — Heart/like system with animated counters
- **Sharing** — Unique URLs, QR codes, and share buttons for WhatsApp and email
- **Gallery** — Creator-curated photo and video showcase with masonry layout

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

Copy `.env.example` (if available) or create `.env.local` with your Firebase config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Testing

```bash
npx playwright test
```

## License

Private
