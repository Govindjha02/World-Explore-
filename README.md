# World Explorer 🌍

A responsive country discovery application built for Milestone 2 — JavaScript Mastery.

## Live demo
Add your Vercel URL here after deployment.

## Features
- Browse countries with flag, capital, population and area
- Debounced search by country name or capital
- Region filter and sorting by name, population or area
- Country details: currencies, languages, borders and Google Maps link
- Border-country chips open the related country's details
- Save/remove favourites with LocalStorage persistence
- Compare two countries side by side
- Dark mode with preference persistence
- Loading skeletons, error/retry state and empty state
- Responsive layout for phones, tablets and desktops
- Load-more rendering to keep the initial page light
- Refresh data without reloading the page

## Tech stack
- HTML5
- Tailwind CSS via CDN
- Vanilla JavaScript (no framework)
- REST Countries API: https://restcountries.com/
- LocalStorage

## Run locally
1. Download or clone this repository.
2. Open the folder in VS Code.
3. Use the VS Code Live Server extension, or run `python -m http.server 5500`.
4. Visit `http://localhost:5500`.

The Tailwind CDN and REST Countries API require an internet connection.

## Project structure
```text
world-explorer/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## API
`https://restcountries.com/v3.1/all?fields=name,flags,population,capital,region,subregion,area,currencies,languages,borders,maps,cca3,cca2,coatOfArms,continents`

The app uses `fetch` with `async/await`, checks HTTP responses, and handles failures with `try/catch`. Request IDs prevent an older response from overwriting a newer refresh.

## Screenshots
Add screenshots after running the project:
- `screenshots/home.png`
- `screenshots/country-details.png`
- `screenshots/compare.png`

## Git workflow
Follow `GIT_WORKFLOW.md` for the suggested branch, commit and pull request workflow.
