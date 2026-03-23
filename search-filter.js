/* ══════════════════════════════════════════════════════════════════════════
   search-filter.js  –  Filtro cocktail da URL (?search=query)
   Da includere nelle pagine di categoria (dopo components.css).

   Funzionamento:
   - Legge ?search= dall'URL
   - Aggiunge body.is-filtering (attiva stili in components.css)
   - Mostra solo i cocktail che matchano (altri in opacity ridotta)
   - Scrolla e apre automaticamente il primo trovato
   - Mostra un banner con info ricerca e tasto "Mostra tutto"

   Nota: nessun CSS viene iniettato via JS — tutti gli stili sono
   in components.css e vengono attivati dalla classe body.is-filtering.
══════════════════════════════════════════════════════════════════════════ */

(function () {
    const params   = new URLSearchParams(location.search);
    const rawQuery = params.get('search') || '';
    if (!rawQuery.trim()) return;

    /* ── Normalizzazione ── */
    function norm(s) {
        return (s || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ');
    }

    const tokens = norm(rawQuery).split(/\s+/).filter(Boolean);

    function matchesArticle(article) {
        const title  = article.querySelector('h3')?.textContent || '';
        const tagline = article.querySelector('.recipe-tagline')?.textContent || '';
        const desc   = article.querySelector('.recipe-desc')?.textContent || '';
        const cat    = article.dataset.category || '';
        const ings   = Array.from(article.querySelectorAll('.ing-item')).map(el => el.textContent).join(' ');
        const text   = norm([title, tagline, desc, cat, ings].join(' '));
        return tokens.every(t => text.includes(t));
    }

    /* ── Banner informativo ── */
    function injectBanner() {
        const banner = document.createElement('div');
        banner.id = 'search-filter-banner';
        banner.setAttribute('role', 'status');
        banner.setAttribute('aria-live', 'polite');
        banner.innerHTML = `
            <div class="sfb-inner">
                <span class="sfb-icon" aria-hidden="true">🔍</span>
                <span class="sfb-text">Risultati per <strong>"${rawQuery}"</strong></span>
                <a href="search-results.html?q=${encodeURIComponent(rawQuery)}"
                   class="sfb-link">Tutti i risultati →</a>
                <button class="sfb-clear" id="sfb-clear-btn"
                        aria-label="Rimuovi filtro e mostra tutti i cocktail">
                    ✕ Mostra tutto
                </button>
            </div>`;
        document.body.insertBefore(banner, document.body.firstChild);

        document.getElementById('sfb-clear-btn').addEventListener('click', () => {
            /* Ricarica la pagina senza parametri di ricerca — più robusto
               di history.back() quando si arriva da un link diretto */
            window.location.href = window.location.pathname;
        });
    }

    /* ── Applica filtro ── */
    function applyFilter() {
        /* Attiva gli stili definiti in components.css */
        document.body.classList.add('is-filtering');

        const articles  = Array.from(document.querySelectorAll('article.recipe-card'));
        if (!articles.length) return;

        let firstMatch  = null;
        let matchCount  = 0;

        articles.forEach(art => {
            const isMatch = matchesArticle(art);
            art.classList.toggle('sf-match',   isMatch);
            art.classList.toggle('sf-nomatch', !isMatch);
            if (isMatch) {
                if (!firstMatch) firstMatch = art;
                matchCount++;
            }
        });

        /* Aggiorna il testo del banner con il conteggio */
        const textEl = document.querySelector('.sfb-text');
        if (textEl) {
            const n = matchCount;
            textEl.innerHTML = `<strong>"${rawQuery}"</strong> — ${n} cocktail trovati`;
        }

        /* Scrolla al primo match e lo apre */
        if (firstMatch) {
            setTimeout(() => {
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (!firstMatch.classList.contains('open')) {
                    /* Supporta sia <button> che <div role="button"> */
                    const toggle = firstMatch.querySelector('.recipe-toggle');
                    if (toggle) toggle.click();
                }
            }, 400);
        }

        return matchCount;
    }

    /* ── Init ── */
    function init() {
        injectBanner();
        applyFilter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
