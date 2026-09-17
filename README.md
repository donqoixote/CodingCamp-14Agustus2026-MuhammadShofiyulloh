# Expense & Budget Visualizer

A mobile-friendly web app to track daily spending: log transactions, see your
total balance update live, browse your history, and view a pie chart of
spending by category. Pure HTML/CSS/JavaScript, no backend, all data stored
in the browser's Local Storage.

## Features

**Required (MVP)**
- Input form (Item Name, Amount, Category) with validation
- Scrollable transaction list with delete
- Total balance, auto-updating
- Pie chart of spending by category (Chart.js), auto-updating

**Optional challenges implemented (3 required)**
- ✅ Custom categories (add your own from the category dropdown)
- ✅ Sort transactions (by date, amount, or category)
- ✅ Dark / light mode toggle
- 🎁 Bonus: monthly summary card + highlight when spending goes over a
  limit you set

## Folder structure

```
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── .kiro/
    ├── steering/
    │   └── tech-constraints.md
    └── specs/
        └── expense-budget-visualizer.md
```

## Running it locally

No build step needed — just open `index.html` in a browser, or serve the
folder with any static server, e.g.:

```bash
npx serve .
```

## Before you push: use Kiro

This assignment expects a `.kiro` folder that reflects real work done with
the [Kiro](https://kiro.dev/) tool. This repo already includes a starter
steering doc and spec under `.kiro/` — open this project folder in Kiro,
paste in the Technical Constraints from the assignment, and let Kiro help
you refine the spec, break down features, and debug as you go, so your
`.kiro/` folder reflects your own session before you submit.

## Deploying to GitHub Pages

1. Create a new repository named:
   `CodingCamp-[batch date ddmmyy]-[participantname]`
   (batch date = the first day of the course, e.g. `CodingCamp-31August26-yamaroni`)
2. In GitHub Desktop: add this project folder as a local repository, commit
   all files, and publish/push to the repository above.
3. On GitHub.com, go to **Settings → Pages**, set the source branch (e.g.
   `main`) and folder (`/root`), and save.
4. GitHub will give you a live URL like
   `https://<username>.github.io/<repo-name>/` — open it and confirm the app
   works there.

## Submission checklist

- [ ] Repo named `CodingCamp-[ddmmyy]-[participantname]`
- [ ] `.kiro/` folder present in the repo
- [ ] Code pushed to GitHub
- [ ] Site published via GitHub Pages and working
- [ ] Submit on Paperform: AWS/Kiro Builder ID, GitHub repo URL, published
      site URL
