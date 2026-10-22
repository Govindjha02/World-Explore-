/* World Explorer — Vanilla JavaScript, REST Countries API */
"use strict";

const API_URL = "https://restcountries.com/v3.1/all?fields=name,flags,population,capital,region,subregion,area,currencies,languages,borders,maps,cca3,cca2,coatOfArms,continents";
const STORAGE_KEYS = { favorites: "worldExplorer:favorites", theme: "worldExplorer:theme" };
const PAGE_SIZE = 12;
const state = { countries: [], filtered: [], visibleCount: PAGE_SIZE, favorites: loadStorage(STORAGE_KEYS.favorites, []), view: "all", loading: false, requestId: 0, selectedForCompare: [] };
const $ = (selector, root = document) => root.querySelector(selector);
const grid = $("#countryGrid");
const statusArea = $("#statusArea");
const modalRoot = $("#modalRoot");

function loadStorage(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
  catch (error) { console.warn(`Could not read ${key} from LocalStorage`, error); return fallback; }
}
function saveStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (error) { console.error(`Could not save ${key}`, error); showToast("Browser storage is unavailable."); return false; }
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function numberFormat(value) {
  return Number.isFinite(Number(value)) ? new Intl.NumberFormat("en-US").format(Number(value)) : "—";
}
function countryName(country) { return country?.name?.common || "Unknown country"; }
function countryByCode(code) { return state.countries.find(country => country.cca3 === code); }
function getCurrencies(country) {
  const currencies = Object.values(country.currencies || {});
  return currencies.length ? currencies.map(item => `${item.name}${item.symbol ? ` (${item.symbol})` : ""}`).join(", ") : "Not available";
}
function getLanguages(country) { return Object.values(country.languages || {}).join(", ") || "Not available"; }
function isFavorite(code) { return state.favorites.includes(code); }
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast"; toast.textContent = message; $("#toastRegion").append(toast);
  window.setTimeout(() => toast.remove(), 2600);
}
function showSkeletons() {
  grid.innerHTML = Array.from({ length: 8 }, () => '<div class="skeleton" aria-hidden="true"></div>').join("");
}
function showError(message) {
  statusArea.innerHTML = `<div class="status-box"><span aria-hidden="true">⚠</span><div><strong>We couldn't load the countries.</strong><div class="mt-1">${escapeHTML(message)}</div></div><button type="button" data-action="retry">Try again</button></div>`;
}
async function fetchCountries() {
  const requestId = ++state.requestId;
  state.loading = true;
  $("#refreshBtn").disabled = true; $("#refreshIcon").classList.add("spin");
  statusArea.innerHTML = ""; $("#emptyState").classList.add("hidden"); showSkeletons();
  $("#resultsLabel").textContent = "Finding countries around the world…";
  try {
    const response = await fetch(API_URL, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(`Server responded with ${response.status}. Check your connection and try again.`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("The API returned an unexpected response.");
    if (requestId !== state.requestId) return; // Ignore stale response from an older request.
    state.countries = data.filter(country => country?.name?.common && country?.cca3).sort((a, b) => countryName(a).localeCompare(countryName(b)));
    state.loading = false;
    $("#totalStat").textContent = state.countries.length || "250+";
    applyFilters();
    showToast("Country data refreshed.");
  } catch (error) {
    if (requestId !== state.requestId) return;
    state.loading = false;
    showError(error instanceof TypeError ? "You may be offline. Reconnect and retry." : error.message || "An unexpected error occurred.");
    grid.innerHTML = ""; $("#resultsLabel").textContent = "Unable to load data";
  } finally {
    if (requestId === state.requestId) {
      $("#refreshBtn").disabled = false; $("#refreshIcon").classList.remove("spin");
    }
  }
}
function applyFilters() {
  const query = $("#searchInput").value.trim().toLocaleLowerCase();
  const region = $("#regionFilter").value;
  const sort = $("#sortSelect").value;
  let results = state.countries.filter(country => {
    const matchesQuery = countryName(country).toLocaleLowerCase().includes(query) ||
      (country.capital || []).some(capital => capital.toLocaleLowerCase().includes(query));
    const matchesRegion = region === "all" || country.region === region;
    const matchesView = state.view === "all" || isFavorite(country.cca3);
    return matchesQuery && matchesRegion && matchesView;
  });
  const comparators = {
    "name-asc": (a, b) => countryName(a).localeCompare(countryName(b)),
    "name-desc": (a, b) => countryName(b).localeCompare(countryName(a)),
    "population-desc": (a, b) => (b.population || 0) - (a.population || 0),
    "population-asc": (a, b) => (a.population || 0) - (b.population || 0),
    "area-desc": (a, b) => (b.area || 0) - (a.area || 0),
    "area-asc": (a, b) => (a.area || 0) - (b.area || 0)
  };
  state.filtered = results.sort(comparators[sort] || comparators["name-asc"]);
  state.visibleCount = PAGE_SIZE;
  renderCountries();
}
function countryCard(country) {
  const name = countryName(country);
  const capital = (country.capital || ["No capital listed"])[0];
  const saved = isFavorite(country.cca3);
  return `<article class="country-card">
    <div class="country-flag-wrap"><span class="flag-glow"></span><img class="country-flag" src="${escapeHTML(country.flags?.svg || country.flags?.png || "")}" alt="Flag of ${escapeHTML(name)}" loading="lazy" referrerpolicy="no-referrer"><button class="favorite-button ${saved ? "saved" : ""}" data-action="favorite" data-code="${escapeHTML(country.cca3)}" type="button" aria-label="${saved ? "Remove" : "Save"} ${escapeHTML(name)} ${saved ? "from" : "to"} favorites" title="${saved ? "Remove from saved places" : "Save country"}">${saved ? "♥" : "♡"}</button></div>
    <div class="country-card-body"><div class="country-card-top"><div><h3 class="country-name">${escapeHTML(name)}</h3><p class="country-capital">⌖ ${escapeHTML(capital)}</p></div><span class="region-chip">${escapeHTML(country.region || "Other")}</span></div>
    <div class="country-meta"><div><span class="meta-label">Population</span><span class="meta-value">${numberFormat(country.population)}</span></div><div><span class="meta-label">Area · km²</span><span class="meta-value">${numberFormat(country.area)}</span></div></div>
    <div class="card-actions"><button class="card-action primary" data-action="details" data-code="${escapeHTML(country.cca3)}" type="button">Explore details ↗</button><button class="card-action" data-action="compare-add" data-code="${escapeHTML(country.cca3)}" type="button" aria-label="Add ${escapeHTML(name)} to compare">⇄ Compare</button></div></div>
  </article>`;
}
function renderCountries() {
  const countries = state.filtered.slice(0, state.visibleCount);
  grid.innerHTML = countries.map(countryCard).join("");
  const count = state.filtered.length;
  $("#resultsLabel").textContent = `${numberFormat(count)} ${state.view === "saved" ? "saved places" : "countries found"}`;
  $("#emptyState").classList.toggle("hidden", count !== 0);
  $("#loadMoreBtn").classList.toggle("hidden", state.visibleCount >= count);
  $("#allViewBtn").classList.toggle("active", state.view === "all");
  $("#savedViewBtn").classList.toggle("active", state.view === "saved");
  updateCounts();
}
function updateCounts() {
  $("#favoriteCount").textContent = state.favorites.length;
  $("#savedStat").textContent = state.favorites.length;
  $("#compareCount").textContent = state.selectedForCompare.length;
}
function toggleFavorite(code) {
  if (isFavorite(code)) { state.favorites = state.favorites.filter(item => item !== code); showToast("Removed from your saved places."); }
  else { state.favorites.push(code); showToast("Added to your saved places."); }
  saveStorage(STORAGE_KEYS.favorites, state.favorites);
  applyFilters();
}
function openDetails(code) {
  const country = countryByCode(code);
  if (!country) return;
  const name = countryName(country);
  const borderCountries = (country.borders || []).map(border => countryByCode(border)).filter(Boolean);
  const coat = country.coatOfArms?.svg || country.coatOfArms?.png;
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <button class="modal-close" data-action="close-modal" type="button" aria-label="Close details">×</button>
    <div class="modal-hero"><img class="modal-flag" src="${escapeHTML(country.flags?.svg || country.flags?.png || "")}" alt="Flag of ${escapeHTML(name)}"><div><p class="section-kicker">${escapeHTML(country.region || "WORLD")} ${country.subregion ? `· ${escapeHTML(country.subregion)}` : ""}</p><h2 id="modalTitle" class="font-display mt-2 text-2xl font-extrabold sm:text-3xl">${escapeHTML(name)}</h2><p class="mt-1 text-sm text-slate-500 dark:text-slate-300">${escapeHTML((country.capital || ["Capital not listed"]).join(", "))}</p></div></div>
    <div class="modal-content"><div class="detail-grid">
      <div class="detail-cell"><small>Population</small><strong>${numberFormat(country.population)}</strong></div><div class="detail-cell"><small>Area</small><strong>${numberFormat(country.area)} km²</strong></div>
      <div class="detail-cell"><small>Region</small><strong>${escapeHTML(country.region || "Not available")}</strong></div><div class="detail-cell"><small>Country code</small><strong>${escapeHTML(country.cca3 || "—")}</strong></div>
      <div class="detail-cell"><small>Currency</small><strong>${escapeHTML(getCurrencies(country))}</strong></div><div class="detail-cell"><small>Languages</small><strong>${escapeHTML(getLanguages(country))}</strong></div>
    </div>
    <h3 class="modal-section-title">Bordering countries · ${borderCountries.length}</h3>
    <div>${borderCountries.length ? borderCountries.map(border => `<button class="border-chip" data-action="details" data-code="${escapeHTML(border.cca3)}" type="button">${escapeHTML(countryName(border))} ↗</button>`).join("") : '<span class="text-sm text-slate-500">No land borders listed (island or borderless country).</span>'}</div>
    <h3 class="modal-section-title">Explore further</h3><div class="flex flex-wrap gap-2"><a class="rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white dark:bg-mint dark:text-ink" href="${escapeHTML(country.maps?.googleMaps || "https://www.google.com/maps")}" target="_blank" rel="noopener noreferrer">Open on Google Maps ↗</a>${coat ? `<img src="${escapeHTML(coat)}" alt="Coat of arms of ${escapeHTML(name)}" class="ml-auto h-12 w-12 object-contain">` : ""}<button class="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold dark:border-slate-700" data-action="favorite" data-code="${escapeHTML(code)}" type="button">${isFavorite(code) ? "♥ Saved" : "♡ Save country"}</button></div>
    </div></section></div>`;
  document.body.style.overflow = "hidden";
  const closeButton = $(".modal-close", modalRoot); closeButton?.focus();
}
function closeModal() { modalRoot.innerHTML = ""; document.body.style.overflow = ""; }
function addToCompare(code) {
  if (state.selectedForCompare.includes(code)) { state.selectedForCompare = state.selectedForCompare.filter(item => item !== code); showToast("Country removed from comparison."); }
  else if (state.selectedForCompare.length >= 2) { showToast("Compare up to two countries. Remove one first."); return; }
  else { state.selectedForCompare.push(code); showToast("Added to comparison."); }
  updateCounts();
  if (state.selectedForCompare.length === 2) openCompare();
}
function openCompare() {
  const countries = state.selectedForCompare.map(countryByCode).filter(Boolean);
  if (countries.length < 2) { showToast("Select two countries to compare."); return; }
  const rows = [
    ["Flag", ...countries.map(c => `<img class="h-9 w-14 rounded object-cover" src="${escapeHTML(c.flags?.svg || c.flags?.png || "")}" alt="Flag of ${escapeHTML(countryName(c))}">`)],
    ["Country", ...countries.map(c => escapeHTML(countryName(c)))],
    ["Capital", ...countries.map(c => escapeHTML((c.capital || ["—"]).join(", ")))],
    ["Region", ...countries.map(c => escapeHTML(c.region || "—"))],
    ["Population", ...countries.map(c => numberFormat(c.population))],
    ["Area", ...countries.map(c => `${numberFormat(c.area)} km²`)],
    ["Currencies", ...countries.map(c => escapeHTML(getCurrencies(c)))],
    ["Languages", ...countries.map(c => escapeHTML(getLanguages(c)))],
    ["Borders", ...countries.map(c => (c.borders || []).length)]
  ];
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="compareTitle"><button class="modal-close" data-action="close-modal" type="button" aria-label="Close comparison">×</button><div class="modal-content pt-8"><p class="section-kicker">SIDE BY SIDE</p><h2 id="compareTitle" class="font-display mt-2 text-2xl font-extrabold">A tale of two countries<span class="text-emerald-500">.</span></h2><p class="mt-2 text-sm text-slate-500">Compare the facts and find the differences.</p><div class="compare-table-wrap mt-6"><table class="compare-table"><thead><tr><th>Attribute</th>${countries.map(c => `<th>${escapeHTML(countryName(c))}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("")}</tbody></table></div><div class="mt-5 flex flex-wrap gap-2"><button class="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold dark:border-slate-700" data-action="clear-compare" type="button">Clear comparison</button><button class="rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white dark:bg-mint dark:text-ink" data-action="close-modal" type="button">Done</button></div></div></section></div>`;
  document.body.style.overflow = "hidden";
}
function setTheme(dark) {
  document.documentElement.classList.toggle("dark", dark);
  $("#themeToggle").textContent = dark ? "☀" : "☾";
  saveStorage(STORAGE_KEYS.theme, dark ? "dark" : "light");
}
function debounce(callback, delay = 280) {
  let timeoutId;
  return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => callback(...args), delay); };
}

// Event delegation: one listener handles dynamic country cards, border chips, and modal actions.
document.addEventListener("click", event => {
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    const { action, code } = actionButton.dataset;
    if (action === "favorite") { toggleFavorite(code); if (modalRoot.innerHTML) { const wasOpen = true; openDetails(code); if (!wasOpen) closeModal(); } return; }
    if (action === "details") { openDetails(code); return; }
    if (action === "compare-add") { addToCompare(code); return; }
    if (action === "retry") { fetchCountries(); return; }
    if (action === "close-modal") { closeModal(); return; }
    if (action === "clear-compare") { state.selectedForCompare = []; updateCounts(); closeModal(); showToast("Comparison cleared."); return; }
    if (action === "backdrop-close" && event.target === actionButton) { closeModal(); return; }
  }
});
$("#searchInput").addEventListener("input", debounce(applyFilters));
$("#regionFilter").addEventListener("change", applyFilters);
$("#sortSelect").addEventListener("change", applyFilters);
$("#refreshBtn").addEventListener("click", fetchCountries);
$("#allViewBtn").addEventListener("click", () => { state.view = "all"; applyFilters(); });
$("#savedViewBtn").addEventListener("click", () => { state.view = "saved"; applyFilters(); });
$("#favoritesNav").addEventListener("click", () => { state.view = "saved"; applyFilters(); $("#explore").scrollIntoView({ behavior: "smooth" }); });
$("#compareNav").addEventListener("click", openCompare);
$("#loadMoreBtn").addEventListener("click", () => { state.visibleCount += PAGE_SIZE; renderCountries(); });
$("#clearFiltersBtn").addEventListener("click", () => { $("#searchInput").value = ""; $("#regionFilter").value = "all"; $("#sortSelect").value = "name-asc"; state.view = "all"; applyFilters(); });
$("#themeToggle").addEventListener("click", () => setTheme(!document.documentElement.classList.contains("dark")));
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); $("#searchInput").focus(); }
});
setTheme(loadStorage(STORAGE_KEYS.theme, "light") === "dark");
updateCounts();
fetchCountries();
