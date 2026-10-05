# Deep dive: global payroll & HR best practice → PayCore HR design

Research date: September 2026. Statutory figures change every budget cycle — confirm with each tax authority before go-live.

## 1. What a payroll platform must get right

Payroll is the one HR process where an error is immediately visible to every employee and to the tax authority. The research converges on six non-negotiables:

**Rules as data, not code.** Tax bands, reliefs and social-security caps change yearly (Nigeria rewrote PAYE from January 2026; Kenya raised the NSSF ceiling from KES 72,000 to 108,000 in February 2026; South Africa indexed its brackets 3.4% for 2026/27). Leading vendors ship country "profiles" so a budget change is a config update. PayCore stores each country as an editable JSON pack.

**Segregation of duties.** The person who prepares payroll must not approve or release it. PayCore enforces maker-checker on the server for runs and loans, with distinct payroll officer, approver, HR admin and auditor roles.

**Pre-approval exception review.** Most payroll losses come from ghost employees, redirected bank accounts and unnoticed swings. Every calculation flags missing bank/tax IDs, negative or sub-threshold net pay, variance above a set % vs the previous run, joiners, leavers and proration.

**Bank-detail change control.** Redirecting salary to a new account is the most common payroll fraud. Staff can request bank changes in self-service, but HR must approve them and the change is logged separately.

**Effective-dated records.** Salary changes are versioned with effective dates so history, arrears and audits reconcile; corrections and raises are separate actions.

**Complete audit trail.** Sign-ins, failed sign-ins, every change, calculation, approval, export and payslip view are logged.

## 2. Country research (2026)

| Country | Income tax | Key contributions | Notes built into pack |
|---|---|---|---|
| Nigeria | NTA 2025, from 1 Jan 2026: 0% to ₦800k, 15% to ₦3m, 18% to ₦12m, 21% to ₦25m, 23% to ₦50m, 25% above | Pension 8% EE / 10% ER on basic+housing+transport; NHF 2.5% of basic (now voluntary); NSITF 1%; ITF 1% | CRA abolished; rent relief = 20% of declared rent, max ₦500k; 1% minimum tax gone; TIN required |
| Kenya | 10% / 25% / 30% / 32.5% / 35%, personal relief KES 2,400/month | NSSF 6%+6% to UEL KES 108,000 (Phase 4, Feb 2026); SHIF 2.75% (min 300); Housing levy 1.5%+1.5%; NITA KES 50 | NSSF, SHIF and AHL deducted before PAYE (verify AHL treatment); insurance relief 15% |
| Ghana | 0% on first GHS 5,880/yr then 5% → 35% | SSNIT 5.5% EE / 13% ER on basic, cap GHS 69,000/month (2026) | Deduct SSNIT before PAYE; verify against Act 1178 (2026 amendment) |
| South Africa | 2026/27: 18% → 45% across 7 brackets; primary rebate R17,820 (+R9,765 at 65, +R3,249 at 75) | UIF 1%+1% capped at R17,712/month; SDL 1% | Tax year March–February; retirement deduction cap R430,000 |
| United Kingdom | 2026/27 rUK: 0% to £12,570, 20%, 40%, 45% | Class 1 NIC 8%/2% EE, 15% ER above £5,000/yr; auto-enrolment 5%/3% | Cumulative PAYE (YTD) with refunds; taper, Scottish rates and student loans need configuration |
| UAE | None | GPSSA for nationals (opt-in); end-of-service gratuity accrual | Accrual shown as employer cost |
| Any other | Blank template | Social security EE/ER | Clone and configure |

The engine was checked against published worked examples: Kenya KES 100,000 → KES 19,308 PAYE; Ghana GHS 6,000 → GHS 1,016; South Africa R30,000/month → R4,681; Nigeria ₦6m gross → ₦792,240/yr; UK £3,000 month 1 → £390.50 tax + £156.20 NIC. These are automated tests (`npm test`).

## 3. Best practice → feature map

| Best practice | Where it lives |
|---|---|
| Multi-entity, multi-currency, per-country rules | Entities + country packs; each run uses its entity's pack and currency |
| Annualised and cumulative (YTD true-up) tax | `method` in each pack; cumulative can refund over-deducted tax |
| Proration for joiners, leavers and unpaid leave | Working-day or calendar-day basis per entity; public holidays excluded |
| Earnings flagged taxable / pensionable / prorated | Pay components with GL codes |
| Regular, supplementary, bonus and off-cycle runs | Run types; off-cycle for final settlements |
| Maker-checker with rejection reasons | Run workflow: draft → calculated → submitted → approved → paid |
| Exception review before approval | Checks tab with blocking vs review severities; override logged |
| Statutory remittance by authority | Statutory schedule export with employee IDs |
| Accounting integration | Balanced GL journal export |
| Bank payment file | Bank schedule export (available only after approval) |
| Employee self-service | Payslips (print/PDF), annual tax statement, leave, loans/advances, profile & bank change requests |
| Manager self-service | Team view and leave approval for direct reports |
| Loans and salary advances | Amortisation preview, 50%-of-net affordability check, approval, auto-deduction, manual settlement |
| Leave management | Entitlement by grade, joiner proration, adjustments, overlap check, unpaid leave feeds payroll |
| HR lifecycle alerts | Probation/contract end, missing tax ID or bank account, birthdays, turnover |
| Data protection (NDPA, GDPR, POPIA, Kenya DPA) | RBAC, account masking, audit of payslip views/exports, session expiry, lockout |
| Bulk onboarding | CSV employee import with template; bulk self-service account creation |
| Business continuity | Named backups with retention, integrity-checked restore with safety copy, maintenance mode |
| White label | Branding settings applied to portal, sign-in, payslips and statements |

## 4. Known limits (next iterations)
- Statutory e-filing (e.g. KRA iTax, SARS EMP201/IRP5 files, HMRC RTI) — exports are CSV today.
- US federal/state withholding (W-4 based) is not modelled; configure a custom pack or integrate a tax API.
- Retro-pay is handled as an ARREARS input rather than automatic recalculation of past periods.
- Single-currency per entity; multi-currency split pay is not supported.
- No email/SMS notifications yet (payslip-ready, leave decisions).
