# Block Lab — Coding Tree

Eksperymentalne, blokowe środowiska do nauki programowania dla dzieci,
opublikowane pod adresem **https://block-lab.codingtree.pl/**. Strona główna
(`index.html`) ma kartę dla każdego z nich.

## Środowiska

| Katalog | Nazwa | Status | Co to jest |
|---------|-------|--------|------------|
| `actor-scratch/` | ActorScratch | v1, główny | Drzewo supervisorów, scena, edytor bloków i runtime z tick-loop; model aktorów jak w Erlangu. |
| `ai-block-studio/` | AI Block Studio | prototyp | Edytor w stylu MakeCode z przełączaniem bloki ↔ kod, nagrywarką sesji i integracją z API Anthropic. |
| `story-stack/` | StoryStack | v1, archiwum | Interaktywne historie, quizy i gry tekstowe: zmienne, pętle, warunki, losowość. |
| `bit-stack/` | BitStack | v1, nowy | Logika binarna, bramki logiczne i prawa De Morgana; skill tree, wyzwania i sandbox. |
| `pixel-stack/` | PixelStack | v1, nowy | Gry 2D z bloków: piksele, game loop, fizyka, AI wrogów; skill tree z wyzwaniami. |
| `radio-room/` | RadioRoom | v1, nowy | Wiele małych urządzeń, wspólne radio i niepewna sieć; 12 wyzwań. |
| `sort-lab/` | SortLab | v1, nowy | Algorytmy sortowania z trzech stron: wyścig (`race/`), karty (`cards/`) i prowadzenie algorytmu krok po kroku (`driver/`). |

## Użycie

Otwórz https://block-lab.codingtree.pl/ albo `index.html` danego katalogu
bezpośrednio w przeglądarce. To czysty HTML/CSS/JS, bez zależności do
instalowania i bez kroku budowania.

## Krok w Coding Tree

Każde środowisko przypisane do mapy programu Coding Tree ma na dole strony
jedną linię kroku, np. „Ten krok w Coding Tree: Biały pas — Pierwsze
programy”. To element z atrybutem `data-curriculum-step="<id kroku>"`
(klasa `step-line`), jedyne miejsce z tym tekstem na stronie, więc później
łatwo zamienić go w link do `/mapa#<id kroku>`.

- `curriculum-steps.json`: katalog środowiska → lista id kroków z mapy
  (StoryStack i ActorScratch na razie nie mają kroku).
- `curriculum-step-ids.json`: skopiowana lista kroków mapy, tylko `id`,
  nazwa pasa (`belt`) i umiejętność (`skill`).
- `scripts/check-steps.mjs`: sprawdza, że każde id z `curriculum-steps.json`
  jest na liście, a linia kroku na stronie ma tę nazwę pasa i umiejętność.
  Uruchom `node scripts/check-steps.mjs` (bez zależności); testy:
  `node --test scripts/*.test.mjs`.

Odświeżanie listy: pobierz `curriculum-map.json` z
[coding-tree/ctdojo-curriculum](https://github.com/coding-tree/ctdojo-curriculum)
i przepisz do `curriculum-step-ids.json` dla każdego wpisu z `steps` jego
`id`, `skill` i polską nazwę pasa dla `rank` (np. `white` → „Biały pas”,
`orange-blue` → „Pomarańczowo-niebieski pas”), a dla każdego wpisu z
`sidePaths` jego `id`, `belt: "Ścieżka boczna"` i `skill` równe `title`.
Mapa nie ma dziś polskich nazw pasów, więc są nadane tutaj. Potem uruchom
`node scripts/check-steps.mjs`.

## Dokumentacja

- `docs/plans/`: projekty i plany BitStack, PixelStack oraz tłumaczenia
  polsko-angielskiego.
- `docs/actor-scratch-notes.md`: notatki z sesji projektowej ActorScratch
  (dawny `README.md`): architektura aktorów, bloki v1 i plany na v2.

## Licencja

CC BY-NC 4.0, zobacz `LICENSE`.
