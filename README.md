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

## Dokumentacja

- `docs/plans/`: projekty i plany BitStack, PixelStack oraz tłumaczenia
  polsko-angielskiego.
- `docs/actor-scratch-notes.md`: notatki z sesji projektowej ActorScratch
  (dawny `README.md`): architektura aktorów, bloki v1 i plany na v2.

## Licencja

CC BY-NC 4.0, zobacz `LICENSE`.
