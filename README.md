# ActorScratch — Projekt / Session Notes

> Środowisko wizualnego programowania dla dzieci (11–15 lat)  
> oparte na modelu aktorów z Erlanga.  
> Autor sesji: Damian / Coding Tree, Kołobrzeg

---

## Kontekst projektu

**Coding Tree** to szkoła programowania (non-profit) w Kołobrzegu działająca ~4 lata.
Uczniowie: ~30/rok, wiek 9–12 i 13–17, cotygodniowe sesje 60–90 min.
Obecne curriculum: Scratch → Python → Web (HTML/CSS/JS).

**Cel tego projektu:**
Zbudować nowe środowisko edukacyjne, które zastąpi/uzupełni Scratcha,
ale wprowadzi uczniów w system aktorów (Erlang/OTP) jako naturalną
metaforę dla współbieżności, izolacji stanu i komunikacji przez wiadomości.

---

## Pliki w tym archiwum

### `actor-scratch-v1.html` ⭐ GŁÓWNY PLIK
Pierwsza pełna implementacja środowiska ActorScratch.

**Co zawiera:**
- Modal wyboru trybu projektu (Pętla Gry / Prezentacja)
- 3-kolumnowy layout: Drzewo Supervisorów | Scena | Edytor Bloków
- Pełny runtime z tick-loop i animowanymi wiadomościami
- Bloki kodu per aktor (lifecycle, messages, state, control, game, presentation)

**Uruchomienie:** otwórz bezpośrednio w przeglądarce (plik HTML, zero zależności).

---

### `ai-block-studio.html`
Poprzednia iteracja — MakeCode-style dual-mode editor.

**Co zawiera:**
- Przełączanie Bloki ↔ Kod (z synchronizacją w obie strony)
- Nagrywarka sesji (każda akcja = klatka z timestampem)
- Odtwarzanie z symulatorem kursora (jak nagranie terminala)
- Eksport logu sesji
- AI → Bloki przez API Anthropic

**Status:** prototyp feature'ów do integracji w actor-scratch-v2.

---

### `ai-scratch.html`
Pierwsza wersja — prosta (Scratch-like bloki + API Claude).

**Co zawiera:**
- Bloki: start, say, wait, repeat, set-var, show-var
- Bloki AI: zapytaj, historia, wyjaśnij, przetłumacz, wiersz
- Efekt pisania na maszynce dla odpowiedzi AI
- Interpolacja zmiennych `{nazwa}` w tekstach

**Status:** proof-of-concept, nie rozwijany dalej.

---

### `ai-scratch-v2.html`
Pośrednia wersja (jeśli istnieje) — wariant ai-scratch z drobnymi poprawkami.

---

## Architektura ActorScratch (konceptualna)

### Model Aktorów (Erlang-inspired)

```
Każdy aktor:
  - ma unikalny PID (<0.N.0>)
  - ma własny mailbox (kolejka wiadomości)
  - ma izolowany stan wewnętrzny (key→value)
  - komunikuje się TYLKO przez wysyłanie wiadomości
  - nie dzieli pamięci z innymi aktorami
  - może spawnować nowych aktorów
  - może zostać nadzorowany przez Supervisor
```

### Typy węzłów

| Typ | Ikona | Rola | Ma ciało na scenie? |
|-----|-------|------|---------------------|
| `ROOT` | ⬡ | Aktor nadrzędny (Clock lub Conductor) | ✅ |
| `SUPERVISOR` | 🛡 | Nadzorca — tylko polityka, bez kodu | ❌ (tylko w drzewie) |
| `WORKER` | dowolna | Aktor roboczy z blokami kodu | ✅ |

### Supervisor policies (jak w OTP)
- `one_for_one` — restartuj tylko martwy proces
- `one_for_all` — restartuj wszystkich gdy jeden padnie
- `rest_for_one` — restartuj martwego + wszystkich startowanych po nim

### Dwa tryby projektu

**🎮 Pętla Gry**
```
RootActor = Clock
  └─ bije tick co N ms
  └─ broadcast: wyślij "tick" do wszystkich
Workers reagują równolegle
Przykład: Physics, Input, Player, Enemy_1
```

**🎬 Prezentacja / Animacja**
```
RootActor = Conductor
  └─ zarządza kolejką slajdów
  └─ na event "next" → wyślij "play" do następnego aktora
Workers = Slide_1, Slide_2, Narrator, Transitions
Jeden aktywny w danym momencie, reszta czeka
```

---

## Bloki kodu (v1)

### ⚡ Życie aktora
| Blok | Opis |
|------|------|
| `🟢 gdy uruchomiony` | trigger: start programu |
| `🔴 gdy zatrzymany` | trigger: stop |
| `💀 zakończ się` | aktor kończy działanie |
| `🔄 spawnuj aktora: [nazwa]` | tworzy nowego workera |

### 📨 Wiadomości
| Blok | Opis |
|------|------|
| `📨 gdy dostanę: [typ]` | handler na wiadomość danego typu |
| `📤 wyślij do: [aktor] [typ] {dane}` | point-to-point |
| `📡 wyślij do wszystkich: [typ]` | broadcast |
| `↩️ odpowiedz: [typ] {dane}` | reply do nadawcy |

### 🧠 Stan
| Blok | Opis |
|------|------|
| `📦 stan.[pole] = [wartość]` | ustaw wartość (obsługuje wyrażenia: `stan.x + 5`) |
| `👁 czytaj stan.[pole]` | odczytaj wartość |
| `🖨 wypisz: [wartość]` | debug output |

### 🔁 Sterowanie
| Blok | Opis |
|------|------|
| `⏱ czekaj: [ms]` | pauza |
| `🔁 powtórz: [n] razy` | pętla |
| `❓ jeżeli wiadomość to: [typ]` | conditional |

### 🎮 Pętla Gry
| Blok | Opis |
|------|------|
| `⏱ taktuj co: [ms]` | definiuje tick rate RootActora |
| `🕐 na każdy tick` | handler tick |

### 🎬 Prezentacja
| Blok | Opis |
|------|------|
| `📋 kolejka slajdów: [S1, S2, S3]` | definiuje kolejność |
| `📛 tytuł slajdu: [tekst]` | ustawia tytuł |
| `🎨 kolor tła: [#hex]` | background aktora |
| `✨ przejście: [typ]` | animacja przejścia |

---

## Co planujemy w v2

### Priorytety
1. **Widok Kod ↔ Bloki** (jak MakeCode) — synchronizacja w obie strony
2. **Nagrywarka sesji** z powrotem (z ai-block-studio) — do nagrywania tutoriali
3. **Supervisor restart** — gdy aktor `self_stop`, supervisor go restartuje wg. policy
4. **Pattern matching na wiadomościach** — `gdy dostanę: {move, X, Y}`
5. **Wizualizacja drzewa jako graf** (nie tylko lista) — z animowanymi połączeniami

### Dalej
- Eksport do GIF (sesja nagrywania)
- API Anthropic: AI generuje bloki z opisu po polsku
- Tryb prezentacji edukacyjnej: nauczyciel nagrywa krok-po-kroku

---

## Konwencje plików

> **Nigdy nie nadpisujemy istniejących plików.**
> Nowe wersje → nowe pliki z sufiksem `-v2`, `-v3` itd.

```
actor-scratch-v1.html   ← aktualna
actor-scratch-v2.html   ← następna iteracja (nie istnieje jeszcze)
ai-block-studio.html    ← poprzedni prototyp (feature reference)
ai-scratch.html         ← najwcześniejszy prototyp
```

---

## Jak kontynuować w Claude Code (CLI)

```bash
# Zainstaluj Claude Code jeśli nie masz:
npm install -g @anthropic/claude-code

# W katalogu z plikami:
cd ~/path/do/actor-scratch/
claude

# Przykładowy prompt startowy:
# "Kontynuujemy projekt ActorScratch. 
#  Główny plik to actor-scratch-v1.html.
#  Architektura: system aktorów Erlang, 3 typy węzłów (root/supervisor/worker),
#  2 tryby (game loop / presentation), animowane wiadomości.
#  Nowe wersje zapisujemy jako actor-scratch-v2.html (nie nadpisujemy).
#  Następny cel: dodaj widok kodu z synchronizacją bloki↔kod."
```

---

## Stack techniczny

- **Zero dependencies** — czysty HTML/CSS/JS
- Google Fonts: `Outfit` (UI) + `DM Mono` (kod)
- CSS Variables dla theming
- Vanilla JS — brak frameworków (celowo, czytelność kodu)
- Animacje: CSS keyframes + Web Animations API

---

## Kontakt / kontekst

Projekt rozwijany w ramach **Coding Tree** — szkoły programowania w Kołobrzegu.
Sesja projektowa prowadzona z Claude (Anthropic) jako narzędziem do rapid prototyping.

*"Architekturę najpierw w głowie, potem w kodzie."*
