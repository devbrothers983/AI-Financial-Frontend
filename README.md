# AI Financial Coach

A full-stack personal finance app that helps people track income and expenses, set budgets and savings goals, and get AI-generated advice on whether a purchase actually fits their finances — plus a full admin portal for managing the platform.

## What it does

- **Track transactions** — log income and expenses by category, payment method, and recurrence.
- **Set monthly budgets** — an overall cap, optional per-category limits, and an optional link to a savings goal so any money left over at month-end is automatically added to that goal.
- **Set savings goals** — a target amount and date; the app tracks whether you're actually on pace to hit it and flags you if you fall behind.
- **Get warned before overspending** — adding an expense that would blow your budget (overall or a specific category) shows a confirmation popup explaining the impact, including how it affects a linked goal, before it's saved.
- **Ask the AI Coach** — "Can I afford this?" gets a real answer (AFFORDABLE / CAUTION / NOT_RECOMMENDED) reasoned from your actual income, expenses, budget, and goals — not a fixed rule.
- **See reports** — income vs. expenses trends, savings rate, and spending by category.
- **Contact & feedback** — messages sent through the Contact page or in-app Feedback form reach the admin inbox, and admins can reply by email directly from the app.
- **Admin portal** — a separate view for admins: platform-wide stats, user management (search, promote/demote, activate/deactivate, delete), signup/login activity, platform-wide reports, and the message inbox.
- **Installable as an app (PWA)** — can be installed to a phone or desktop home screen and keeps working offline for pages you've already visited (financial data itself always comes fresh from the server, never from a stale cache).
- **Light/dark theme**, Google sign-in, and email-based password reset.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | Next.js (App Router), Redux Toolkit, Tailwind CSS, shadcn/ui, framer-motion |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT auth, Nodemailer, Cloudinary |
| AI service | Python, FastAPI, Groq LLM |

## Project structure

```
AI-Financial-Coach/
├── frontend/     Next.js web app (what users and admins see)
├── Backend/      Express API (auth, transactions, budgets, goals, admin, etc.)
└── ai-service/   FastAPI microservice that calls Groq to reason about affordability
```

All three run as separate processes and must all be running for the app to fully work — the frontend talks to the Backend, and the Backend talks to the ai-service only when the AI Coach is used.

 

## How people use the app

### As a regular user

1. **Register or sign in** — with email/password or Google.
2. **Dashboard** — see this month's income, expenses, net cash flow, budget status, active goals, and recent transactions at a glance.
3. **Transactions** — log every income or expense as it happens.
4. **Budgets** — set a monthly spending cap, optionally with per-category limits, and optionally link it to a goal so unspent money is swept into that goal automatically at month-end.
5. **Goals** — set a savings target and date; the app shows whether you're on pace and warns you if you're falling behind.
6. **AI Coach** — before a purchase, ask "can I afford this?" and get a reasoned answer based on your real numbers.
7. **Reports** — review trends over the last 6 months and see where money is actually going.
8. **Settings** — update your profile, photo, and password.
9. **Contact / Feedback** — reach the team directly from the app; you'll get a reply by email.
10. **Install it** — on a supported browser (Chrome/Edge), an "Install AI Financial Coach" prompt appears after logging in, adding it to your home screen like a native app.

### As an admin

Admins see the same sidebar with an additional set of sections:

1. **Dashboard** — platform-wide stats instead of personal finances: total users, active/new users, platform transaction volume, recent signups.
2. **Users** — search all users, promote/demote admin access, activate/deactivate accounts, or delete a user (and their data).
3. **User Activity** — a feed of recent signups and logins across the platform.
4. **Reports** — platform-wide income/expense trends, user growth, and top expense categories.
5. **Security** — see who has admin access and which accounts are deactivated.
6. **Logs** — a raw chronological event log of account activity.
7. **Messages** — every Contact form and in-app Feedback submission lands here; admins can reply, and the reply is emailed straight to the sender.
 