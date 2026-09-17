# Spec: Expense & Budget Visualizer

## Summary
A mobile-friendly, client-side web app that lets a user log daily transactions,
see their total balance, browse a scrollable transaction history, and view a
pie chart breakdown of spending by category. All data persists in the
browser's Local Storage — there is no backend.

## MVP Requirements
1. **Input Form** — Item Name, Amount, Category (Food / Transport / Fun).
   Adds a transaction on submit; blocks submission if any field is empty.
2. **Transaction List** — scrollable, shows name / amount / category, each
   item deletable.
3. **Total Balance** — shown at the top, recalculated automatically whenever
   a transaction is added or removed.
4. **Visual Chart** — pie chart (Chart.js) of spending by category, redrawn
   automatically whenever the transaction list changes.

## Optional Challenges Implemented
- **Custom categories** — the category dropdown includes "+ Add custom
  category…", which prompts for a name and stores it alongside the defaults.
- **Sort transactions** — a sort control on the Transactions card supports
  newest/oldest first, amount high→low / low→high, and category.
- **Dark / light mode toggle** — a header button switches themes and
  remembers the choice in Local Storage.
- (Bonus, beyond the required 3) **Monthly summary** and **spending-limit
  highlighting** are also implemented — see the "Monthly Summary" card and
  the "Set monthly limit" control under Total Balance.

## Data Model (Local Storage)
- `ebv_transactions`: `[{ id, name, amount, category, date }]`
- `ebv_categories`: custom category names added by the user
- `ebv_theme`: `"light" | "dark"`
- `ebv_monthly_limit`: optional numeric spending limit

## Out of Scope
- No backend, no accounts, no sync across devices.
- No automated test suite (not required per NFR-1).
