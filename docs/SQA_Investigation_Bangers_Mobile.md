# Software Quality Assurance (SQA) Rapport - Bangers Mobile

**Datum:** 24 april 2026  
**Project:** Bangers Festival Mobile App (React Native / Expo)  
**Status:** Beta / Development  

---

## 1. Samenvatting van belangrijkste bevindingen

De Bangers Mobile applicatie vertoont een hoge mate van technische volwassenheid in de kernarchitectuur. Het gebruik van een robuuste offline-first strategie met een gespecialiseerde SQLite-laag (inclusief WAL-modus en write-mutex) is een sterk punt. De code is over het algemeen modulair en volgt moderne React Native best practices.

Echter, er zijn kritieke falingen geconstateerd in de huidige testsuite die wijzen op regressies in de authenticatie-logica. Daarnaast ontbreken er essentiële compliance-functies die noodzakelijk zijn voor een publieke release.

---

## 2. Analyse per Dimensie

### 1. Functionele Correctheid
- **Status:** Grotendeels correct, maar risicovol.
- **Bevindingen:** De offline functionaliteit voor groepsroosters werkt na recente fixes, maar de synchronisatie-logica (Delta Sync) heeft geen robuuste error-recovery. Als een fetch halverwege faalt, kan de database in een inconsistente staat blijven zonder duidelijke melding aan de gebruiker.
- **Edge cases:** Wisselen tussen Wi-Fi en 4G tijdens een sync-sessie is niet expliciet afgedekt in de code.

### 2. Codekwaliteit en Onderhoudbaarheid
- **Status:** Hoog.
- **Bevindingen:**
    - Consistente toepassing van TypeScript.
    - Goede scheiding tussen UI (Components), Business Logic (Hooks) en Data Access (Repositories).
    - **Verbeterpunt:** Er wordt een mix van MMKV en AsyncStorage gebruikt. MMKV is superieur voor performance; consolidatie is aanbevolen.

### 3. Teststrategie en Dekking
- **Status:** Kritiek (Rood).
- **Bevindingen:**
    - De huidige testsuite faalt op 2 vitale punten: `useAuthStore` (methode mismatch) en `apiClient` (faling in logout-trigger bij 401).
    - Testdekking is geconcentreerd op utility functies, terwijl complexe UI-interacties (zoals de Timetable grid) ongetest blijven.

### 4. Performance en Schaalbaarheid
- **Status:** Goed.
- **Bevindingen:**
    - SQLite indexes zijn correct toegepast op veelgevraagde kolommen (`start_date`, `deleted_at`).
    - Gebruik van `flash-list` zorgt voor soepele weergave van grote act-lijsten.
    - **Bottleneck:** De `ProfileScreen` voert veel zware berekeningen uit in de render-fase die gememoiseerd zouden moeten worden.

### 5. Beveiliging (Security)
- **Status:** Voldoende.
- **Bevindingen:**
    - Gevoelige data (tokens) wordt correct opgeslagen in `SecureStore`.
    - Geen SQL-injectie risico's gevonden door consequent gebruik van geparametriseerde queries.
    - **Risico:** Geen Certificate Pinning aanwezig, wat de app kwetsbaar maakt voor Man-in-the-Middle aanvallen in onveilige Wi-Fi netwerken (typisch voor festivals).

### 6. Betrouwbaarheid en Foutafhandeling
- **Status:** Gemiddeld.
- **Bevindingen:**
    - Er is een gecentraliseerde logger die fouten rapporteert.
    - Foutafhandeling in repositories is aanwezig maar vaak beperkt tot een `console.warn`. Er is geen globale UI-state om de gebruiker te informeren over "Local Cache Mode".

### 7. Compliance en Standaarden
- **Status:** Onvoldoende.
- **Bevindingen:**
    - Geen mogelijkheid voor de gebruiker om hun account te verwijderen (verplicht voor Apple App Store).
    - Geen privacy-instellingen of data-export opties (GDPR).

---

## 3. Geprioriteerde Lijst van Issues

| Prioriteit | Issue | Impact |
| :--- | :--- | :--- |
| **HOOG** | Faling in Auth Refresh tests | Kritieke beveiliging/UX faling bij verlopen sessies. |
| **HOOG** | Test Suite Regressie | CI/CD onbetrouwbaar door verouderde store-tests. |
| **MIDDEN** | Sync Robustness | Risico op data-corruptie bij netwerkonderbreking. |
| **MIDDEN** | MMKV Consolidatie | Inconsistentie in persistence-laag. |
| **LAAG** | GDPR / Account Deletion | Blokkerend voor App Store release. |

---

## 4. Aanbevelingen

### Direct (Quick Wins)
1. **Fix Test Mismatch:** Update `useAuthStore.test.ts` zodat deze de nieuwe `updateSession` methode gebruikt in plaats van de niet-bestaande `updateAccessToken`.
2. **Auth Repair:** Onderzoek waarom de `apiClient` logout-mock niet getriggerd wordt in de tests en herstel de interceptor-logica.
3. **Logout Button:** Voeg een duidelijke Logout-optie toe aan het profielscherm.

### Lange Termijn
1. **Zod Integratie:** Gebruik `zod` voor schema-validatie op alle API-endpoints om runtime errors te minimaliseren.
2. **Offline Mode UI:** Implementeer een subtiele "Offline" banner in de header wanneer `NetInfo` aangeeft dat er geen verbinding is.
3. **GDPR Workflow:** Voeg een "Delete Account" functionaliteit toe die ook de lokale SQLite cache volledig wist.

---

## 5. Conclusie
De Bangers Mobile app is technisch zeer goed opgezet, maar de focus moet nu verschuiven van *feature development* naar *stability & compliance*. De falingen in de testsuite zijn het meest urgente punt van aandacht.
