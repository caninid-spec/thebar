/* ══════════════════════════════════════════════════════════════════════════
   search-filter.js  –  Filtro cocktail da URL (?search=query)
   Da includere nelle pagine di categoria.
   
   Funzionamento:
   - Legge ?search= dall'URL
   - Mostra solo i cocktail che matchano (altri in opacity ridotta)
   - Scrolla e apre automaticamente il primo trovato
   - Mostra un banner con info ricerca e tasto "mostra tutto"
══════════════════════════════════════════════════════════════════════════ */

(function () {
    const params = new URLSearchParams(location.search);
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
        const title = article.querySelector('h3')?.textContent || '';
        const tagline = article.querySelector('.recipe-tagline')?.textContent || '';
        const desc = article.querySelector('.recipe-desc')?.textContent || '';
        const cat = article.dataset.category || '';
        const ings = Array.from(article.querySelectorAll('.ing-item')).map(el => el.textContent).join(' ');
        const text = norm([title, tagline, desc, cat, ings].join(' '));
        return tokens.every(t => text.includes(t));
    }

    /* ── Crea banner ── */
    function injectBanner() {
        const banner = document.createElement('div');
        banner.id = 'search-filter-banner';
        banner.innerHTML = `
            <div class="sfb-inner">
                <span class="sfb-icon">🔍</span>
                <span class="sfb-text">Risultati per <strong>"${rawQuery}"</strong></span>
                <a href="#" class="sfb-link" id="sfb-results-link">Tutti i risultati →</a>
                <button class="sfb-clear" id="sfb-clear-btn">✕ Mostra tutto</button>
            </div>`;
        document.body.insertBefore(banner, document.body.firstChild);

        document.getElementById('sfb-results-link').addEventListener('click', e => {
            e.preventDefault();
            window.location.href = 'search-results.html?q=' + encodeURIComponent(rawQuery);
        });

        document.getElementById('sfb-clear-btn').addEventListener('click', () => {
            history.back();
        });
    }

    /* ── Applica filtro ── */
    function applyFilter() {
        const articles = Array.from(document.querySelectorAll('article.recipe-card'));
        if (!articles.length) return;

        let firstMatch = null;
        let matchCount = 0;

        articles.forEach(art => {
            if (matchesArticle(art)) {
                art.classList.add('sf-match');
                art.classList.remove('sf-nomatch');
                if (!firstMatch) firstMatch = art;
                matchCount++;
            } else {
                art.classList.add('sf-nomatch');
                art.classList.remove('sf-match');
            }
        });

        if (firstMatch) {
            setTimeout(() => {
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (!firstMatch.classList.contains('open')) {
                    const toggle = firstMatch.querySelector('.recipe-toggle');
                    if (toggle) toggle.click();
                }
            }, 400);
        }

        return matchCount;
    }

    /* ── CSS dinamico (dark theme override) ── */
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #search-filter-banner {
                position: sticky;
                top: 0;
                z-index: 100;
                background: rgba(26,28,30,0.97);
                border-bottom: 1px solid rgba(201,168,76,0.25);
                padding: 10px 20px;
                backdrop-filter: blur(10px);
            }
            .sfb-inner {
                max-width: 900px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            .sfb-icon { font-size: 0.9rem; }
            .sfb-text {
                flex: 1;
                font-size: 0.82rem;
                color: var(--silver2, #9aa0ac);
                min-width: 0;
                font-family: var(--font-sans, sans-serif);
            }
            .sfb-text strong { color: var(--gold, #c9a84c); }
            .sfb-link {
                font-size: 0.78rem;
                color: var(--gold, #c9a84c);
                text-decoration: none;
                white-space: nowrap;
                font-weight: 500;
                font-family: var(--font-sans, sans-serif);
            }
            .sfb-link:hover { text-decoration: underline; }
            .sfb-clear {
                background: none;
                border: 1px solid rgba(201,168,76,0.25);
                border-radius: 20px;
                padding: 3px 12px;
                font-size: 0.75rem;
                color: var(--muted, #5a6070);
                cursor: pointer;
                font-family: var(--font-sans, sans-serif);
                white-space: nowrap;
                transition: background 0.15s, color 0.15s;
            }
            .sfb-clear:hover {
                background: rgba(201,168,76,0.1);
                color: var(--gold, #c9a84c);
            }
            article.recipe-card.sf-nomatch {
                opacity: 0.2;
                filter: grayscale(0.5);
                pointer-events: none;
                transition: opacity 0.2s;
            }
            article.recipe-card.sf-match {
                opacity: 1;
                border-color: rgba(201,168,76,0.4) !important;
                box-shadow: 0 0 0 2px rgba(201,168,76,0.1);
                transition: opacity 0.2s;
            }
        `;
        document.head.appendChild(style);
    }

    /* ── Init ── */
    function init() {
        injectStyles();
        injectBanner();
        applyFilter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
