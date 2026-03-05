# RealEstate Pro — Claude Code Instructions

## Project Overview
A full-stack real estate property comparison and PDF report generation system.
Agents manage developers, compounds, and individual units. The comparison engine
scores and ranks units against customer requirements and can export branded PDF reports.

## Tech Stack
- **Frontend**: React (Vite), React Router, plain CSS (dark glassmorphism theme)
- **Backend**: Node.js + Express (ESM), Prisma ORM, SQLite (local) / Postgres (prod)
- **PDF**: Custom PDF generator in `server/services/pdfGenerator.js`
- **Deployment**: Railway (`railway.json`, `nixpacks.toml`)

## Project Structure
```
client/
  src/
    App.jsx                  # Router + Sidebar
    index.css                # Global design system (CSS variables, components)
    pages/
      Dashboard.jsx          # Stats overview
      Developers.jsx         # CRUD for developers
      Compounds.jsx          # CRUD for compounds
      Units.jsx              # CRUD for units (incl. floor plan upload)
      Comparison.jsx         # Requirements-based matching (customer → matching units)
      UnitComparison.jsx     # Direct unit-to-unit side-by-side comparison (select units)

server/
  server.js                  # Express app + all API routes
  services/
    comparisonEngine.js      # Scoring/ranking logic for requirements-based comparison
    pdfGenerator.js          # PDF generation with puppeteer/pdfkit
  prisma/
    schema.prisma            # Data models: Developer, Compound, Unit, CustomerRequirement, ComparisonReport
    seed.js                  # Seed data for empty database
```

## Key Data Models
- **Developer** → has many Compounds
- **Compound** → belongs to Developer, has many Units
- **Unit** → belongs to Compound; holds price, area, bedrooms, bathrooms, view,
  finishingType, investment metrics (appreciationRate, rentYield, valueForMoney, etc.)
- **CustomerRequirement** → saved when a requirements-based comparison is run

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PUT/DELETE | `/api/developers/:id?` | Developer CRUD |
| GET/POST/PUT/DELETE | `/api/compounds/:id?` | Compound CRUD |
| GET/POST/PUT/DELETE | `/api/units/:id?` | Unit CRUD |
| POST | `/api/units/:id/floor-plan` | Upload floor plan image (multipart) |
| DELETE | `/api/units/:id/floor-plan` | Remove floor plan image |
| POST | `/api/compare` | Requirements-based unit matching |
| POST | `/api/reports/pdf` | Generate and download PDF report |
| GET | `/api/stats` | Dashboard aggregate statistics |

## Running Locally
```bash
# Install root deps
npm install

# Install + run server
cd server && npm install && npx prisma generate && node server.js

# Install + run client (separate terminal)
cd client && npm install && npm run dev
```

Server runs on port 3001. Client dev server proxies `/api` to the server.

## Design Conventions
- CSS variables defined in `client/src/index.css` — always use them (`var(--color-primary)`, etc.)
- Class names: `.card`, `.card-header`, `.card-title`, `.btn`, `.btn-primary`, `.form-input`,
  `.form-select`, `.form-group`, `.form-row`, `.table`, `.badge`, `.page-header`, `.page-title`
- All currency formatted as EGP via `Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' })`
- Dark theme — no light mode support

## Comparison Features
1. **Requirements Match** (`/comparison`): Customer fills requirements → system scores all units → ranked results + PDF download
2. **Unit Comparison** (`/unit-comparison`): Select 2–4 specific units → side-by-side table with best/worst value highlighting

## Notes
- SQLite in dev, use `DATABASE_URL` env var to point to Postgres in production
- Floor plan images stored in `server/uploads/`, served at `/uploads/*`
- `prisma generate` must run before starting the server
- Never commit `.env` files or the `server/uploads/` directory
