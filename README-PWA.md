# The Bar - Configurazione PWA e Theme Color

## ✅ Modifiche completate

### 1. Meta tag theme-color
Tutti i file HTML ora includono:
```html
<meta name="theme-color" content="#043927" />
```
Questo colora la **barra di Chrome su Android** in verde scuro.

### 2. Manifest PWA (manifest.json)
Creato il file `manifest.json` con:
- `theme_color`: #043927 (verde smeraldo scuro)
- `background_color`: #043927
- Configurazione per installazione come PWA

### 3. Meta tag Apple
Aggiunti meta tag per iOS:
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="The Bar">
```

### 4. Link al manifest
Tutti i file HTML ora linkano il manifest:
```html
<link rel="manifest" href="manifest.json">
```

## 📱 Risultato

### Su Chrome/Android:
- ✅ Barra degli indirizzi verde (#043927)
- ✅ Status bar di sistema verde quando installato come PWA
- ✅ Splash screen verde all'avvio della PWA

### Su Safari/iOS:
- ✅ Status bar configurata (black-translucent)
- ✅ Nome app "The Bar" quando aggiunta alla home

## 🎨 Icone da generare (opzionale ma raccomandato)

Il manifest.json riferisce a tre icone che NON sono state generate:
- `icon-192.png` (192x192 px)
- `icon-512.png` (512x512 px)
- `thebar.ico` (già presente)

### Come generare le icone PNG:

**Opzione A - Da favicon esistente:**
Se vuoi usare l'emoji 🍸 come nella favicon:
1. Vai su https://realfavicongenerator.net/
2. Carica `thebar.ico`
3. Scarica i PNG nelle dimensioni 192x192 e 512x512

**Opzione B - Design personalizzato:**
1. Crea un'icona quadrata 512x512 px
2. Sfondo verde scuro (#043927)
3. Emoji 🍸 o logo al centro
4. Usa un tool online come https://www.pwabuilder.com/ per generare tutte le dimensioni

**Opzione C - Rimuovere dal manifest:**
Se non vuoi creare le icone, modifica `manifest.json` e lascia solo:
```json
"icons": [
  {
    "src": "thebar.ico",
    "sizes": "48x48 32x32 16x16",
    "type": "image/x-icon"
  }
]
```

## 🧪 Come testare

1. **Chrome DevTools:**
   - Apri DevTools (F12)
   - Vai su Application > Manifest
   - Verifica che sia caricato correttamente

2. **Android Chrome:**
   - Apri il sito su Chrome Android
   - La barra dovrebbe essere già verde
   - Menu > "Aggiungi alla schermata Home"
   - Apri l'app installata > status bar verde

3. **Lighthouse PWA audit:**
   - DevTools > Lighthouse
   - Esegui audit PWA
   - Verifica score (mancheranno solo le icone se non generate)

## 📦 File modificati

- ✅ manifest.json (nuovo)
- ✅ index.html
- ✅ category.html
- ✅ cocktail-all.html
- ✅ cocktail-finder.html
- ✅ cocktail-recipe.html
- ✅ search-results.html
- ✅ README-PWA.md (questo file)

## 🚀 Deploy

Carica tutti i file sul tuo server. Il manifest funzionerà solo su HTTPS (eccetto localhost per test).
