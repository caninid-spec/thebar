/* ══════════════════════════════════════════════════════════════════════════
   search-index.js  –  Indice di ricerca cocktail
   Caricato su ogni pagina. Gestisce autocomplete e navigazione.
══════════════════════════════════════════════════════════════════════════ */

(function () {
'use strict';

/* ── Normalizzazione ── */
function norm(s) {
    return (s || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ');
}

/* ── Config categorie ── */
const CATEGORY_PAGES = {
    unforgettables: { label: 'The Unforgettables', emoji: '✨', url: 'cocktail-unforgettables.html' },
    contemporary:   { label: 'The Contemporary Classics', emoji: '🍸', url: 'cocktail-contemporary.html' },
    new_era:        { label: 'The New Era Drinks', emoji: '🚀', url: 'cocktail-new-era.html' },
    aperitivi:      { label: 'Aperitivi', emoji: '🥂', url: 'cocktail-aperitivi.html' },
    light:          { label: 'Light Spirited', emoji: '🌿', url: 'cocktail-light.html' },
    dark:           { label: 'Dark Spirited', emoji: '🌑', url: 'cocktail-dark.html' },
    classics:       { label: 'Classics', emoji: '🏛️', url: 'cocktail-classics.html' },
    soft:           { label: 'Soft Cocktails', emoji: '🌱', url: 'cocktail-soft.html' },
    basics:         { label: 'Basics', emoji: '🧪', url: 'cocktail-basics.html' }
};

/* ── Costruzione indice da COCKTAILS ── */
function buildIndex() {
    if (typeof COCKTAILS === 'undefined') return [];
    return COCKTAILS.map(c => {
        // Determina le categorie del cocktail per i link
        const categories = [];
        if (c.ibaCategory && CATEGORY_PAGES[c.ibaCategory]) categories.push(c.ibaCategory);
        if (c.nomadCategory && CATEGORY_PAGES[c.nomadCategory]) categories.push(c.nomadCategory);

        const primaryCat = categories[0] || null;
        const page = primaryCat ? CATEGORY_PAGES[primaryCat] : null;

        return {
            id: c.id,
            title: c.name,
            emoji: c.emoji,
            tagline: c.tagline,
            description: c.description || '',
            baseSpirits: (c.baseSpirits || []).join(' '),
            ingredients: (c.ingredients || []).join(' '),
            taste: (c.taste || []).join(' '),
            iba: c.iba,
            difford: c.difford,
            ibaCategory: c.ibaCategory,
            nomadCategory: c.nomadCategory,
            categories: categories,
            // Keywords per ricerca
            keywords: [
                c.name,
                c.tagline,
                ...(c.baseSpirits || []),
                ...(c.ingredients || []),
                ...(c.taste || []),
                c.strength || '',
                c.style || '',
                c.serve || ''
            ].join(' '),
            // URL pagina singola ricetta
            recipeUrl: `cocktail-recipe.html?id=${c.id}`,
            // URL categoria principale
            categoryUrl: page ? page.url + `?highlight=${c.id}` : `cocktail-recipe.html?id=${c.id}`,
            categoryLabel: page ? page.label : '',
            categoryEmoji: page ? page.emoji : ''
        };
    });
}

/* ── Inizializzazione search UI ── */
function initSearch() {
    const input    = document.getElementById('search-input');
    const dropdown = document.getElementById('search-dropdown');
    const clearBtn = document.getElementById('search-clear');
    const statusEl = document.getElementById('search-status');

    if (!input || !dropdown) return;

    let index = [];
    // Attendi che COCKTAILS sia disponibile
    if (typeof COCKTAILS !== 'undefined') {
        index = buildIndex();
    } else {
        window.addEventListener('load', () => { index = buildIndex(); });
    }

    let debounceTimer = null;

    function showDropdown(results) {
        if (!results.length) {
            dropdown.hidden = true;
            return;
        }
        dropdown.innerHTML = results.slice(0, 8).map(r => `
            <a class="sd-item" href="${r.recipeUrl}">
                <span class="sd-emoji">${r.emoji}</span>
                <div class="sd-body">
                    <div class="sd-title">${r.title}</div>
                    <div class="sd-meta">${r.categoryEmoji} ${r.categoryLabel || 'Cocktail'}</div>
                </div>
                ${r.iba ? '<span class="sd-badge sd-badge--iba">IBA</span>' : ''}
                ${r.difford && !r.iba ? '<span class="sd-badge sd-badge--difford">DG</span>' : ''}
            </a>
        `).join('') + (results.length > 8 ? `
            <a class="sd-more" href="search-results.html?q=${encodeURIComponent(input.value)}">
                Vedi tutti i ${results.length} risultati →
            </a>
        ` : '');
        dropdown.hidden = false;
    }

    function search(query) {
        if (!query.trim()) {
            dropdown.hidden = true;
            if (statusEl) statusEl.textContent = '';
            return;
        }
        const tokens = norm(query).split(/\s+/).filter(Boolean);
        const results = index.filter(r => {
            const text = norm(r.keywords + ' ' + r.title);
            return tokens.every(t => text.includes(t));
        }).sort((a, b) => {
            // Priorità: match nel nome
            const an = norm(a.title).includes(norm(query)) ? 1 : 0;
            const bn = norm(b.title).includes(norm(query)) ? 1 : 0;
            return bn - an;
        });
        showDropdown(results);
        if (statusEl) {
            statusEl.textContent = results.length ? `${results.length} cocktail trovati` : 'Nessun risultato';
        }
    }

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const val = input.value.trim();
        if (clearBtn) clearBtn.hidden = !val;
        debounceTimer = setTimeout(() => search(val), 180);
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && input.value.trim()) {
            e.preventDefault();
            window.location.href = 'search-results.html?q=' + encodeURIComponent(input.value.trim());
        }
        if (e.key === 'Escape') {
            dropdown.hidden = true;
            input.blur();
        }
    });

    // Navigazione tasti freccia nel dropdown
    input.addEventListener('keydown', e => {
        const items = dropdown.querySelectorAll('.sd-item');
        const active = dropdown.querySelector('.sd-item.active');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!active) items[0]?.classList.add('active');
            else {
                active.classList.remove('active');
                const next = active.nextElementSibling;
                if (next && next.classList.contains('sd-item')) next.classList.add('active');
                else items[0]?.classList.add('active');
            }
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (active) {
                active.classList.remove('active');
                const prev = active.previousElementSibling;
                if (prev && prev.classList.contains('sd-item')) prev.classList.add('active');
            }
        }
        if (e.key === 'Enter' && active) {
            e.preventDefault();
            window.location.href = active.href;
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.hidden = true;
            dropdown.hidden = true;
            if (statusEl) statusEl.textContent = '';
            input.focus();
        });
    }

    document.addEventListener('click', e => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.hidden = true;
        }
    });
}

/* ── Expose utilities ── */
window.CocktailSearch = { buildIndex, norm, CATEGORY_PAGES };

/* ── Auto-init ── */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
} else {
    initSearch();
}

})();
