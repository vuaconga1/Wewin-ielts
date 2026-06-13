# WeWIN IELTS

Next.js app for IELTS practice tests (Listening, Reading, Writing, Speaking). Speaking audio is uploaded to Google Drive and logged to Google Sheets; admin evaluates via Google Apps Script (`AIEvaluate.txt`).

## Requirements

- Node.js 18+
- pnpm (recommended) or npm
- Google Cloud project with OAuth 2.0 credentials
- Google Drive API & Google Sheets API enabled
- OpenAI API key (Writing auto-grade; Speaking via Apps Script on Sheet)

## Setup

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local with your credentials
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [`.env.example`](.env.example). **Do not commit `.env.local`.**

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random string for session encryption |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials |
| `GOOGLE_SHEETS_ID` | Spreadsheet ID for test management |
| `GOOGLE_DRIVE_SPEAKING_FOLDER_ID` | Drive folder for speaking audio |
| `OPENAI_API_KEY` | OpenAI key for Writing evaluation |

## Google Apps Script (Speaking Evaluate)

Copy code from `AIEvaluate.txt` into **Extensions → Apps Script** on the Google Sheet. Configure:

- `OPENAI_API_KEY` — in sheet **Config → B1** (recommended) or Script Properties
- `ADMIN_EMAILS` — admin email(s) to receive PDF reports
- `PDF_DRIVE_FOLDER_ID` — Drive folder ID for generated PDFs

Assign button **Evaluate** to function `generateIELTSReports`.

## Scripts

```bash
pnpm dev      # development
pnpm build    # production build
pnpm start    # run production server
pnpm lint     # ESLint
```
