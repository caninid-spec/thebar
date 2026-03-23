/* ══════════════════════════════════════════════════════════════════════════
   config.js  —  Unica fonte di verità per tutte le costanti condivise
   Caricato prima di qualsiasi altro script su ogni pagina.
   Espone: window.TheBarConfig
══════════════════════════════════════════════════════════════════════════ */

(function () {
'use strict';

window.TheBarConfig = {

    /* ── Emoji per tipo di bicchiere ── */
    GLASS_EMOJI: {
        coupe:      '🍷',
        rocks:      '🥃',
        highball:   '🥤',
        flute:      '🥂',
        martini:    '🍸',
        'nick&nora':'🍸',
        hurricane:  '🌀',
        mule:       '🍺',
        wine:       '🍷',
        shot:       '🥃',
        champagne:  '🥂',
        none:       ''
    },

    /* ── Label localizzate per metodo di servizio ── */
    SERVE_LABEL: {
        stirred:  'Mescolato',
        shaken:   'Shakeraro',
        built:    'Costruito nel bicchiere',
        blended:  'Frullato'
    },

    /* ── Definizione completa di ogni categoria ──
       Usata da: search-index.js, category.html, cocktail-all.html, index.html
       Aggiungere qui una nuova riga è sufficiente per propagare la categoria
       in tutto il sito (filtri, link, header, contatori).
    ── */
    CATEGORY_PAGES: {
        unforgettables: {
            label:    'The Unforgettables',
            emoji:    '✨',
            subtitle: 'I 35 grandi classici IBA. Il cuore della storia del cocktail.',
            filterLabel: 'Unforgettables',
            url:      'category.html?name=unforgettables'
        },
        contemporary: {
            label:    'The Contemporary Classics',
            emoji:    '🍸',
            subtitle: "I classici moderni entrati nell'olimpo IBA tra gli anni '70 e '90.",
            filterLabel: 'Contemporary',
            url:      'category.html?name=contemporary'
        },
        new_era: {
            label:    'The New Era Drinks',
            emoji:    '🚀',
            subtitle: 'I cocktail del XXI secolo: creativi, audaci, già iconici.',
            filterLabel: 'New Era',
            url:      'category.html?name=new_era'
        },
        aperitivi: {
            label:    'Aperitivi',
            emoji:    '🥂',
            subtitle: 'Leggeri, vivaci e invitanti. Per aprire la serata nel modo giusto.',
            filterLabel: 'Aperitivi',
            url:      'category.html?name=aperitivi'
        },
        light: {
            label:    'Light Spirited',
            emoji:    '🌿',
            subtitle: 'Cocktail delicati e rinfrescanti, a bassa gradazione alcolica.',
            filterLabel: 'Light',
            url:      'category.html?name=light'
        },
        dark: {
            label:    'Dark Spirited',
            emoji:    '🌑',
            subtitle: 'Distillati scuri, profondità e carattere. Per i palati più esigenti.',
            filterLabel: 'Dark',
            url:      'category.html?name=dark'
        },
        classics: {
            label:    'Classics',
            emoji:    '🏛️',
            subtitle: 'La selezione Nomad dei grandi classici senza tempo.',
            filterLabel: 'Classics',
            url:      'category.html?name=classics'
        },
        soft: {
            label:    'Soft Cocktails',
            emoji:    '🌱',
            subtitle: 'Senza alcol, ma senza compromessi sul gusto.',
            filterLabel: 'Soft',
            url:      'category.html?name=soft'
        },
        basics: {
            label:    'Basics',
            emoji:    '🧪',
            subtitle: 'Sciroppi, cordiali e preparazioni base da avere sempre pronti.',
            filterLabel: 'Basics',
            url:      'category.html?name=basics'
        }
    },

    /* ── Caricamento dati cocktail ──
       Strategia a due livelli:
       1. fetch() cocktails-data.json  → funziona su qualsiasi server HTTP
       2. Fallback <script> tag        → funziona anche aprendo i file
          direttamente dal filesystem (protocollo file://)
    ── */
    _cocktailsCache: null,
    _cocktailsPromise: null,

    loadCocktails() {
        if (this._cocktailsCache)  return Promise.resolve(this._cocktailsCache);
        if (this._cocktailsPromise) return this._cocktailsPromise;

        this._cocktailsPromise = fetch('cocktails-data.json')
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => this._hydrate(data.cocktails))
            .catch(() => this._loadViaScript());

        return this._cocktailsPromise;
    },

    /* Popola le variabili globali e aggiorna la cache interna */
    _hydrate(cocktails) {
        window.COCKTAILS       = cocktails;
        window.COCKTAILS_BY_ID = Object.fromEntries(cocktails.map(c => [c.id, c]));
        window.IBA_UNFORGETTABLES = cocktails.filter(c => c.ibaCategory === 'unforgettables');
        window.IBA_CONTEMPORARY   = cocktails.filter(c => c.ibaCategory === 'contemporary');
        window.IBA_NEW_ERA        = cocktails.filter(c => c.ibaCategory === 'new_era');
        window.NOMAD_APERITIVI    = cocktails.filter(c => c.nomadCategory === 'aperitivi');
        window.NOMAD_LIGHT        = cocktails.filter(c => c.nomadCategory === 'light');
        window.NOMAD_DARK         = cocktails.filter(c => c.nomadCategory === 'dark');
        window.NOMAD_CLASSICS     = cocktails.filter(c => c.nomadCategory === 'classics');
        window.NOMAD_SOFT         = cocktails.filter(c => c.nomadCategory === 'soft');
        window.NOMAD_BASICS       = cocktails.filter(c => c.nomadCategory === 'basics');
        this._cocktailsCache = cocktails;
        return cocktails;
    },

    /* Fallback: inietta cocktails-data.js come <script> quando fetch non disponibile */
    _loadViaScript() {
        return new Promise((resolve, reject) => {
            // Se COCKTAILS è già presente globalmente, idrata subito
            if (typeof window.COCKTAILS !== 'undefined') {
                return resolve(this._hydrate(window.COCKTAILS));
            }

            // Ricava il base path dalla posizione di config.js
            // così funziona indipendentemente da dove è aperta la pagina
            const configScript = document.querySelector('script[src*="config.js"]');
            const base = configScript
                ? configScript.src.replace('config.js', '')
                : '';

            const script = document.createElement('script');
            script.src = base + 'cocktails-data.js';

            script.onload = () => {
                if (typeof window.COCKTAILS !== 'undefined') {
                    resolve(this._hydrate(window.COCKTAILS));
                } else {
                    reject(new Error('cocktails-data.js caricato ma COCKTAILS non definito'));
                }
            };
            script.onerror = () => reject(new Error('Impossibile caricare cocktails-data.js'));
            document.head.appendChild(script);
        });
    },

    /* ── Helper UI: spinner di caricamento ── */
    showLoader(containerId, message = 'Caricamento cocktail…') {
        const el = document.getElementById(containerId);
        if (el) el.innerHTML = `
            <div class="loader-state">
                <div class="loader-spinner"></div>
                <p class="loader-text">${message}</p>
            </div>`;
    },

    showError(containerId, message = 'Errore nel caricamento dei dati.') {
        const el = document.getElementById(containerId);
        if (el) el.innerHTML = `
            <p class="empty-section">⚠️ ${message} <a href="index.html">Torna alla home →</a></p>`;
    }

};

})();
