# Weather — Feature Spec

**Feature code:** `WX` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 55 · Described 4 · Partial 0

**Sources owned:** `src/components/WeatherWidget.jsx`
**Sources referenced (owned elsewhere):** `src/pages/Dashboard.jsx` (widget registry) → `20-features/dashboard/spec.md` · `src/components/WidgetCard.jsx` → `10-architecture/export-print-email.md` · service commitments (endpoints, parameters, availability) → `10-architecture/external-services.md` §1 · `10-architecture/data-model/seed-data.md` §14 (WMO table, AQI bands) · `10-architecture/preferences.md` Part D (`weather_cache_v3`) · `10-architecture/time-and-date-semantics.md` (AR-TIME-47, AR-TIME-73) · `src/pages/UserManual.jsx` → `20-features/user-manual`

**Permissions:** no entity data; runs entirely in the browser with the browser's geolocation permission; admin-only operations: none

## 0. Entry points & navigation

- Route: none of its own. The widget is the first entry in the dashboard's default order, rendered under the card title **Weather** with body id `dashboard-weather`. `[Implemented]` `src/pages/Dashboard.jsx:22-24,34,264-266`
- Sidebar label: none · Header title text: none · Position in swipe order: not applicable.
- Query parameters accepted: none.
- Feature-toggle gating: none. `[Implemented]` `src/pages/Dashboard.jsx:22-42`
- Header right-slot contents: none; the widget renders no controls of any kind. `[Implemented]` `src/components/WeatherWidget.jsx:115-186`

## 1. Purpose & user benefit

The widget answers "what is it like outside today and this week?" without any setup beyond the browser's location prompt: current temperature and conditions for the user's place, today's high and low, feels-like, humidity, wind, air quality, and a six-day outlook.

User Manual, "Weather Widget" under Dashboard (`src/pages/UserManual.jsx:55-56`) `[Described]`:

> Shows current weather for your location. Requires browser location permission on first load. Displays temperature, conditions, and a short forecast.

Dashboard onboarding step 1 names it first among the widgets `[Described]` `src/pages/Dashboard.jsx:45`: "Your personalized dashboard shows everything at a glance—weather, daily checklist, schedule, tasks, goals, and your daily quote."

## 2. Concepts & vocabulary

Glossary terms used: **widget**, **device-local preference**, **today**.

Feature-local terms, defined once:

- **Condition** — the label and icon derived from a WMO weather code (§5 BR-WX-06). `src/components/WeatherWidget.jsx:4-15`
- **AQI band** — the colour class of a US AQI value (§5 BR-WX-07). `src/components/WeatherWidget.jsx:19-26`
- **Weather cache** — the device-local copy of the last successful result with its fetch time. `src/components/WeatherWidget.jsx:37-44,104`
- **Place name** — the locality shown beside the condition, resolved from coordinates. `src/components/WeatherWidget.jsx:56-66`

## 3. User stories

- **US-WX-01** As the account owner, I want to see today's temperature, conditions, and place name on my dashboard so that I can plan the day. `[Implemented]` `src/components/WeatherWidget.jsx:133-150`
- **US-WX-02** As the account owner, I want feels-like, humidity, wind, and air quality at a glance so that I know how the day will actually feel. `[Implemented]` `src/components/WeatherWidget.jsx:151-169`
- **US-WX-03** As the account owner, I want a six-day outlook so that I can plan the week. `[Implemented]` `src/components/WeatherWidget.jsx:170-183`
- **US-WX-04** As the account owner, I want the widget to reuse a recent result so that I am not asked for location or kept waiting every time I open the dashboard. `[Implemented]` `src/components/WeatherWidget.jsx:37-45,104`
- **US-WX-05** As the account owner who has not granted location, I want a plain message telling me what to enable. `[Implemented]` `src/components/WeatherWidget.jsx:47-50,111,123-128`

## 4. Capabilities & interactions

### 4.1 Load sequence

1. On mount the widget reads the device key `weather_cache_v3`. If it parses to `{ data, timestamp }` and `timestamp` is less than 30 minutes old, `data` is shown immediately and nothing else happens (no location prompt, no network). A missing or unparseable cache is ignored. `[Implemented]` `src/components/WeatherWidget.jsx:32-45`
2. If the browser exposes no geolocation API, loading ends with no data. `[Implemented]` `src/components/WeatherWidget.jsx:47-50`
3. Otherwise the browser's current position is requested. On denial or any position failure, loading ends with no data. `[Implemented]` `src/components/WeatherWidget.jsx:52,111`
4. On success only latitude and longitude are used. The place name is resolved first (§4.2), then the forecast and air-quality requests run in parallel (§4.3, §4.4). `[Implemented]` `src/components/WeatherWidget.jsx:53-80`
5. The assembled result is written to the cache with the current time and shown. Any exception in steps 4–5 leaves the widget with no data. `[Implemented]` `src/components/WeatherWidget.jsx:84-109`
6. There is no refresh control, retry control, timer, or re-fetch while mounted; a new fetch happens only when the widget mounts again with an absent or expired cache (AR-TIME-47). `[Implemented]` `src/components/WeatherWidget.jsx:32-34,115-186`

### 4.2 Place name (reverse geocode)

- Request: Nominatim reverse geocoding with the latitude and longitude, JSON format, no key (service commitment in `10-architecture/external-services.md` §1.3). `[Implemented]` `src/components/WeatherWidget.jsx:57-60`
- Fallback chain for the displayed name: `address.city` → `address.town` → `address.village` → `address.county` → the literal `Your Location`. `[Implemented]` `src/components/WeatherWidget.jsx:61-66`

### 4.3 Forecast request

- Request: Open-Meteo forecast for the coordinates with current `temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `wind_speed_10m`, `weather_code`; daily `weather_code`, `temperature_2m_max`, `temperature_2m_min`; temperature unit Fahrenheit; wind speed unit mph; timezone `auto`; seven forecast days (`10-architecture/external-services.md` §1.4). `[Implemented]` `src/components/WeatherWidget.jsx:69-75`
- Values kept: current temperature, feels-like, humidity, wind speed (rounded to a whole number at this point), weather code; today's high and low from the first daily entry; and, for each of the seven daily entries, the weekday abbreviation, high, low, and weather code. `[Implemented]` `src/components/WeatherWidget.jsx:84-101`

### 4.4 Air quality request

- Request: Open-Meteo air quality for the coordinates with current `us_aqi`, timezone `auto` (`10-architecture/external-services.md` §1.5). `[Implemented]` `src/components/WeatherWidget.jsx:76-79`
- Value kept: `current.us_aqi`, or `null` when absent. `[Implemented]` `src/components/WeatherWidget.jsx:94`

### 4.5 Today block

Heading **Today**, then side by side: the condition icon (large) and a text stack. `[Implemented]` `src/components/WeatherWidget.jsx:131-150`

| Element | Content | Citation |
|---|---|---|
| Temperature | `{round(current temperature)}°F` | `:139` |
| Condition · place | `{condition label} · {place name}` | `:140` |
| High | up-arrow icon + `{round(today's high)}°` (orange carries "high") | `:142-144` |
| Low | down-arrow icon + `{round(today's low)}°` (blue carries "low") | `:145-147` |

Rounding is to the nearest whole number; a missing value is shown as `0`. `[Implemented]` `src/components/WeatherWidget.jsx:139,143,146`

### 4.6 Metric row

A four-column row beneath the Today block, separated from the forecast by a rule. `[Implemented]` `src/components/WeatherWidget.jsx:151-169`

| Cell | Content | Shown when | Citation |
|---|---|---|---|
| Feels like | thermometer icon + `Feels {round(feels-like)}°` | always | `:152-155` |
| Humidity | droplets icon + `{humidity}%` | always (missing → `0%`) | `:156-159` |
| Wind | wind icon + `{wind} mph` | always (missing → `0 mph`) | `:160-163` |
| Air quality | `AQI {value}` in the AQI band colour | only when the AQI value is not null | `:164-168` |

### 4.7 Six-day strip

- Heading **6-Day Forecast**, then a horizontally scrollable row of the forecast entries at indexes 1 through 6 (tomorrow through six days out; today is excluded). Each cell shows the weekday abbreviation, the condition icon, `{round(high)}°`, and `{round(low)}°`. `[Implemented]` `src/components/WeatherWidget.jsx:170-183`
- Weekday abbreviations are `Sun, Mon, Tue, Wed, Thu, Fri, Sat`, chosen by the UTC weekday of the forecast date string (AR-TIME-73). `[Implemented]` `src/components/WeatherWidget.jsx:17,97` (D-128)

### 4a. Keyboard & pointer

- None. The widget has no interactive elements; the forecast strip scrolls horizontally when it overflows. `[Implemented]` `src/components/WeatherWidget.jsx:115-186`

### 4b. View state & persistence

| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|
| Loading | true / false | true | memory `src/components/WeatherWidget.jsx:30` |
| Weather result | null / `{ location, current, forecast[7] }` | null | memory `src/components/WeatherWidget.jsx:29`; device `weather_cache_v3` as `{ data, timestamp }` `:39,104` |

### 4c. Empty & fallback states

- Loading: a centred spinner, no text. `[Implemented]` `src/components/WeatherWidget.jsx:115-121`
- No data (geolocation API absent, permission denied or position failure, geocode or forecast failure, or before any successful fetch): the copy **Enable location to see weather**. `[Implemented]` `src/components/WeatherWidget.jsx:47-50,106-111,123-128`
- Unknown place: `Your Location`. `[Implemented]` `src/components/WeatherWidget.jsx:66`
- AQI unavailable: the AQI cell is omitted; the other three remain. `[Implemented]` `src/components/WeatherWidget.jsx:164-168`
- Missing numeric values render as `0`. `[Implemented]` `src/components/WeatherWidget.jsx:139,143,146,154,158,162,178-179`

## 5. Business rules

- **BR-WX-01 (Cache first, 30 minutes)** A cached result younger than 30 minutes is used without prompting for location or calling any service (AR-TIME-47). `[Implemented]` `src/components/WeatherWidget.jsx:37-44`
- **BR-WX-02 (Location is the only prerequisite)** No account setting, API key, or entity row is involved; only the browser position is needed (AR-EXT-01). `[Implemented]` `src/components/WeatherWidget.jsx:47-58,68-79`
- **BR-WX-03 (Prompt on every expired load)** Location is requested whenever the widget mounts with no fresh cache, not only on first load. `[Implemented]` `src/components/WeatherWidget.jsx:32-52`. The manual says "on first load" `[Described]` `src/pages/UserManual.jsx:56` (D-810).
- **BR-WX-04 (One copy for every failure)** Absent API, denied permission, and any fetch or parse failure all end in the no-data state with the same copy; the cache is not written on failure. `[Implemented]` `src/components/WeatherWidget.jsx:47-50,106-111,123-128`
- **BR-WX-05 (Place name chain)** city → town → village → county → `Your Location`. `[Implemented]` `src/components/WeatherWidget.jsx:61-66`
- **BR-WX-06 (WMO code → condition, first match wins)** `[Implemented]` `src/components/WeatherWidget.jsx:4-15`

| Code | Label | Icon |
|---|---|---|
| `0` | Clear | Sun |
| `≤ 3` | Cloudy | Cloud |
| `≤ 49` | Fog | Cloud |
| `≤ 59` | Drizzle | CloudDrizzle |
| `≤ 69` | Rain | CloudRain |
| `≤ 79` | Snow | CloudSnow |
| `≤ 82` | Showers | CloudRain |
| `≤ 99` | Thunder | CloudLightning |
| otherwise (including undefined) | Wind | Wind |

- **BR-WX-07 (US AQI bands; colour carries meaning)** `[Implemented]` `src/components/WeatherWidget.jsx:19-26`

| AQI | Meaning (source comment) | Colour |
|---|---|---|
| `≤ 50` | Good | green `#22c55e` |
| `≤ 100` | Moderate | yellow `#eab308` |
| `≤ 150` | Unhealthy for sensitive | orange `#f97316` |
| `≤ 200` | Unhealthy | red `#ef4444` |
| `≤ 300` | Very unhealthy | purple `#a855f7` |
| `> 300` | Hazardous | dark red `#7f1d1d` |

- **BR-WX-08 (Units)** Temperatures in °F, wind in mph, humidity in %, AQI as the US index; all numbers rounded to whole units for display, wind rounded at fetch time. `[Implemented]` `src/components/WeatherWidget.jsx:74,90,139-162,178-179`
- **BR-WX-09 (Today's high and low)** Taken from the first daily forecast entry. `[Implemented]` `src/components/WeatherWidget.jsx:92-93`
- **BR-WX-10 (Six-day strip)** Forecast entries at indexes 1–6 of the seven-day response; the condition icon per day comes from that day's weather code via BR-WX-06. `[Implemented]` `src/components/WeatherWidget.jsx:96-101,172-173`
- **BR-WX-11 (Colour on high/low)** Orange marks the high, blue marks the low; the condition icon takes the theme accent. `[Implemented]` `src/components/WeatherWidget.jsx:137,142-147`

### 5a. State & lifecycle

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| loading | fresh cache found | data (cached) | none `src/components/WeatherWidget.jsx:39-44` |
| loading | geolocation API absent | no data | none `:47-50` |
| loading | position denied / position failure | no data | none `:111` |
| loading | position OK, all requests OK | data | cache written `:84-105` |
| loading | position OK, any request throws | no data | none `:106-109` |
| data / no data | widget unmounts and mounts again | loading → (as above) | `:32-34` |

### 5b. Time & date semantics

- Cache age is measured from the stored epoch-millisecond timestamp against the device clock; the threshold is 30 minutes (AR-TIME-47, AR-TIME-82). `[Implemented]` `src/components/WeatherWidget.jsx:40,104`
- Forecast weekday labels use the UTC weekday of the `YYYY-MM-DD` date string (AR-TIME-73), unlike every other weekday computation in the product, which uses local time (AR-TIME-02) (D-128). `[Implemented]` `src/components/WeatherWidget.jsx:97`
- The forecast service is asked for the location's own timezone (`timezone=auto`); "today" in the response is the first daily entry. `[Implemented]` `src/components/WeatherWidget.jsx:74,92-93`
- No "due", "overdue", or "upcoming" notions apply.

## 6. Data

No entity is read or written. `[Implemented]` `src/components/WeatherWidget.jsx:1-2`

Device-local structure `weather_cache_v3` `[Implemented]` `src/components/WeatherWidget.jsx:84-104`:

```
{ data: { location: string,
          current: { temp, feels_like, humidity, wind_speed, weather_code, high, low, aqi | null },
          forecast: [ { day, high, low, weather_code } × 7 ] },
  timestamp: <epoch ms> }
```

External services and their parameters: `10-architecture/external-services.md` §1.2–1.6.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| in | Dashboard | mounted from the widget registry as the first default widget, title "Weather" | `src/pages/Dashboard.jsx:22-24,34` |
| out | External services | browser geolocation; Nominatim reverse geocode; Open-Meteo forecast; Open-Meteo air quality | `10-architecture/external-services.md` §1 |
| out | Preferences | device key `weather_cache_v3` | `10-architecture/preferences.md` Part D |

No navigation targets, query strings, or entity interactions. `[Implemented]` `src/components/WeatherWidget.jsx:1-186`

### 7a. Feedback & notifications

- The browser's own location permission prompt (not product copy). `[Implemented]` `src/components/WeatherWidget.jsx:52`
- No toasts, alerts, confirm dialogs, or celebratory effects. `[Implemented]` `src/components/WeatherWidget.jsx:115-186`

## 8. AI & automation

None observed. `[Implemented]` `src/components/WeatherWidget.jsx:1-186`

## 9. Onboarding content

The widget has no walkthrough of its own. It is named in the Dashboard walkthrough step 1 (quoted in `20-features/dashboard/spec.md` §9). `[Described]` `src/pages/Dashboard.jsx:45`

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `weather_cache_v3` | last successful result and its fetch time, `{ data, timestamp }` | absent → fetch | successful load `src/components/WeatherWidget.jsx:104` | never; ignored once older than 30 minutes `:40` |

## 11. Seed / hardcoded data used

- WMO code table (BR-WX-06) and AQI bands (BR-WX-07). `[Implemented]` `src/components/WeatherWidget.jsx:4-26`; `10-architecture/data-model/seed-data.md` §14.
- Weekday abbreviations `Sun … Sat`, Sunday-first (AR-TIME-31). `[Implemented]` `src/components/WeatherWidget.jsx:17`
- Cache TTL 30 minutes; forecast days 7; strip length 6; fallback place name `Your Location`; empty copy `Enable location to see weather`. `[Implemented]` `src/components/WeatherWidget.jsx:40,74,66,126,172`

## 12. Print / email formats

None. The card body id `dashboard-weather` exists for the card shell's generic handlers, but no control invokes them (D-310, `10-architecture/export-print-email.md`). `[Implemented]` `src/pages/Dashboard.jsx:264-266`

## 13. Acceptance criteria

- **AC-WX-01** Given `weather_cache_v3` holds a result fetched 10 minutes ago, When the dashboard mounts, Then the widget shows that result and no location prompt or network request occurs. (refs BR-WX-01)
- **AC-WX-02** Given the cache is 31 minutes old, When the dashboard mounts, Then the browser location prompt appears (or the stored permission is used) and a new fetch runs. (refs BR-WX-01, BR-WX-03)
- **AC-WX-03** Given the user denies location and no fresh cache exists, When loading ends, Then the widget reads `Enable location to see weather`. (refs BR-WX-04)
- **AC-WX-04** Given the browser has no geolocation API, When the widget mounts, Then it reads `Enable location to see weather` without any network request. (refs BR-WX-02, BR-WX-04)
- **AC-WX-05** Given the reverse geocode returns no city, town, or village but a county `Travis County`, When the widget renders, Then the place name is `Travis County`; Given none of the four, Then it is `Your Location`. (refs BR-WX-05)
- **AC-WX-06** Given the current weather code is `61`, When the widget renders, Then the condition reads `Rain` with the rain icon; Given `95`, Then `Thunder`; Given `0`, Then `Clear`. (refs BR-WX-06)
- **AC-WX-07** Given the current temperature is `72.6` and the wind is `7.4`, When the widget renders, Then the Today block shows `73°F` and the metric row shows `7 mph`. (refs BR-WX-08)
- **AC-WX-08** Given the AQI is `120`, When the widget renders, Then the metric row shows `AQI 120` in orange; Given the AQI is null, Then the metric row shows only feels-like, humidity, and wind. (refs BR-WX-07, §4.6)
- **AC-WX-09** Given a seven-day response, When the widget renders, Then the strip under `6-Day Forecast` shows six cells starting with tomorrow, each with a weekday abbreviation, icon, high, and low. (refs BR-WX-10)
- **AC-WX-10** Given a successful fetch, When it completes, Then `weather_cache_v3` holds the shown result and a timestamp of that moment. (refs BR-WX-01)
- **AC-WX-11** Given the forecast request throws after geolocation succeeds, When loading ends, Then the widget shows `Enable location to see weather` and the cache is unchanged. (refs BR-WX-04)

## 14. Discrepancies & open questions

- **D-810** User Manual says the widget "Requires browser location permission on first load" (`src/pages/UserManual.jsx:56`); the widget requests the position on every mount whose cache is absent or older than 30 minutes (`src/components/WeatherWidget.jsx:32-52`).
- Cited from other specs: **D-128** (UTC weekday for forecast labels vs local weekday elsewhere), **D-310** (card shell handlers without controls).
- Open questions: None observed.
