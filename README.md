# PayCore HR — white-label, multi-country payroll & HR portal

Hosted on **Fly.io**, deployed automatically from **GitHub** (also runs on any PC/server or Docker host).

Zero-dependency Node.js app (no `npm install`) with a plain HTML/CSS/JS front end. One install serves one client; each client can run many legal entities in different countries and currencies.

## Run it on Windows

1. Install **Node.js 22.13 or later** (LTS 22 or 24) from nodejs.org.
2. Unzip the folder, open **Command Prompt** in it and run:
   ```
   npm start
   ```
3. Open http://localhost:4070. The demo database is created on first start.
   To use a different port: `set PORT=5000 && npm start` (Command Prompt) or `$env:PORT=5000; npm start` (PowerShell).

| Username | Password | Role |
|---|---|---|
| admin | Admin@2026 | Super admin (everything) |
| hr | Hr@2026 | HR admin (also a self-service employee and line manager) |
| payroll | Payroll@2026 | Payroll officer (prepares runs) |
| approver | Approve@2026 | Payroll approver (approves, pays, decides loans) |
| auditor | Audit@2026 | Read-only auditor |
| ng1004 … ng1010, ke1011 … ke1014 | Staff@2026 | Employee self-service |

`npm run reset-demo` wipes the database so the demo reseeds on next start.

**Before a client go-live:** deploy with `SEED_DEMO=false` and an `ADMIN_PASSWORD` (see below) so the client starts with an empty database. Then sign in as `admin` and set up branding, entities, pay components and employees.

Run the statutory tests any time with `npm test`.

## Deploy to Fly.io from GitHub

Every push to the `main` branch runs the tests, then deploys to Fly.io through GitHub Actions (`.github/workflows/fly-deploy.yml`). No command line is needed — everything below happens in the browser. The first run creates the Fly app and its data volume automatically.

### 1. Put the code on GitHub
Unzip, then upload **the contents** (so `fly.toml`, `Dockerfile`, `server.js`, `lib/`, `public/` and the hidden `.github/` folder sit at the top of the repo) and commit to `main`.

The `.github` folder is hidden in Windows Explorer. To see it: **View → Show → Hidden items**. If the browser upload skips it, create the file on GitHub instead: **Add file → Create new file**, name it `.github/workflows/fly-deploy.yml`, paste the contents from the zip, and commit.

### 2. Choose the app name and region
Edit `fly.toml` on GitHub (pencil icon):
- `app = "paycore-hr-olans"` → a unique name per client, e.g. `paycore-acme`. The site will be `https://paycore-acme.fly.dev`.
- `primary_region = "lhr"` → London is usually fastest from Nigeria. Decide before the first deploy; the database volume is created there.

### 3. Create a Fly.io token
fly.io → sign in → **Account → Access Tokens → Create token** → copy it.

### 4. Add the token and settings to GitHub
Repo → **Settings → Secrets and variables → Actions**.

**Secrets** tab → **New repository secret**:
| Name | Value |
|---|---|
| `FLY_API_TOKEN` | the Fly token (required) |
| `ADMIN_PASSWORD` | the `admin` login password for this client (recommended) |

**Variables** tab → **New repository variable** (optional):
| Name | Value |
|---|---|
| `SEED_DEMO` | `false` for a real client (empty database, no demo staff or demo logins). Leave unset for a demo site. |
| `FLY_ORG` | your Fly organisation slug if it isn't `personal` |

`ADMIN_PASSWORD` and `SEED_DEMO` only matter on the very first start, when the database is created. On a clean install without `ADMIN_PASSWORD`, `admin` / `Admin@2026` must be changed at first sign-in.

### 5. Deploy
Commit anything to `main`, or go to **Actions → Deploy to Fly.io → Run workflow**. It takes about 2–4 minutes. The last step prints the live address. Open `https://<app>.fly.dev/api/health` — it should show `{"ok":true,"storage":"local"}`.

After that, every push to `main` redeploys. Data stays on the volume between deploys.

### Custom domain
Fly dashboard → your app → **Certificates → Add certificate** → enter e.g. `payroll.clientdomain.com`, then add the DNS records it shows at your domain registrar.

### Backups
- Fly snapshots the data volume daily and keeps 5 days (dashboard → app → **Volumes**).
- In the portal: **Admin → Maintenance & backups** → *Back up now* (kept on the volume) and **Export data** (a JSON file to keep off the server). **Import data** loads an export into another install.

### If the workflow fails
| Message | Fix |
|---|---|
| Missing FLY_API_TOKEN | Add the secret (step 4). |
| Could not create app | The app name is taken or the token is wrong — change `app` in `fly.toml`, or create a new token. |
| Tests failed | Something in the code is broken; nothing was deployed. Open the failed step to see which test. |
| Site did not respond | Fly dashboard → app → **Monitoring** shows the logs. |

### Previously connected to Vercel?
This version no longer includes Vercel or Netlify files. In Vercel, open the project → **Settings → Git → Disconnect** (or delete the project) so pushes stop triggering Vercel builds.

### Optional: Turso database
The app can also store data in Turso (hosted SQLite) instead of the volume: add Fly secrets `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. Not needed for normal use.

## White-labelling a client
Admin → **Branding & settings**: portal name, tagline, colours, logo, sign-in message, payslip footer, support email. Colours and logo flow through the sidebar, sign-in page, payslips and annual statements.

## How payroll works
1. **Payroll officer** creates a run (entity + month). Regular runs pay the salary structure; supplementary, bonus and off-cycle runs pay only variable inputs.
2. Adds one-off inputs (overtime, bonus, deductions) by hand or CSV, then **Calculate**.
3. Reviews **Checks**: missing bank/tax IDs, negative or low net pay, pay swings vs last month, joiners, leavers, proration.
4. **Submit** → a *different* user **Approves** (maker-checker enforced by the server) → payslips publish to staff → download bank schedule → **Mark as paid** (locks the run and posts loan repayments).
5. Exports: payroll register, bank schedule, statutory remittance schedule per authority, balanced GL journal, variance report.

## Adding or updating a country
Admin → **Country tax packs** → Add a country (start from the blank template or clone a similar country) and edit the JSON. Bands are annual; contribution caps are monthly and scale automatically for weekly/bi-weekly pay. Supported: progressive bands, reliefs (fixed, % of declared input, declared amount, % of gross), tax credits/rebates (with age conditions), employee/employer contributions with rates, bands, floors, ceilings, minimums, flat amounts, opt-in/opt-out schemes, non-resident flat rate, and annualised or cumulative (YTD) tax methods.

Included packs (researched September 2026 — **verify before go-live**): Nigeria (NTA 2025), Kenya (NSSF Phase 4, SHIF, AHL), Ghana, South Africa 2026/27, United Kingdom 2026/27, UAE, and a blank template.

## Files
```
.github/workflows/fly-deploy.yml   GitHub Actions: test, then deploy to Fly.io
fly.toml            Fly.io app settings (app name, region, volume, port 4070)
Dockerfile          Container image
server.js           Web server entry point (port 4070)
lib/app.js          Application: auth, roles, all API routes
lib/db.js           Database (SQLite on the volume; optional Turso), schema, first-start seed
lib/engine.js       Pure payroll calculation engine (tested)
lib/countries.js    Seed country tax packs
lib/security.js     Password hashing, role → permission matrix
public/             Single-page app (index.html, app.css, app.js)
tests/              Tax calculation tests + full payroll workflow against the real server
DEEP-DIVE.md        Research findings and best-practice → feature map
```

## Security notes
PBKDF2-SHA512 passwords; HttpOnly SameSite=Strict session cookies (Secure behind HTTPS); temporary passwords forced to change; lockout after 5 failures; CSRF header check; strict CSP; bank account masking in lists; staff bank/ID changes go through HR approval; full audit log including payslip views and exports; nightly backups recommended via Admin → Maintenance (download copies off-site).

## Single-file build (repo without folders)
If your deployment repo can only hold top-level files (for example, files uploaded with GitHub's "choose your files" button), run `node tools/build-single.js`. It writes `dist/`: a `server.js` containing the whole app plus a matching `Dockerfile`, `fly.toml`, `package.json` and `.dockerignore`. Upload those five files to the root of the repo — no `lib/` or `public/` folders needed.
