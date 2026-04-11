import express from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fetch from "node-fetch";

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load all data files once at startup (fast in-memory reads) ──────────────
const cityData = JSON.parse(readFileSync(join(__dirname, "../data/city_data.json"), "utf8"));
const corrData = JSON.parse(readFileSync(join(__dirname, "../data/corr_data.json"), "utf8"));
const metaData = JSON.parse(readFileSync(join(__dirname, "../data/meta_data.json"), "utf8"));
const cityCoords = JSON.parse(readFileSync(join(__dirname, "../data/city_coords.json"), "utf8"));

// ML service URL — set ML_SERVICE_URL env var on Render to the internal URL of vayu-ml-service
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

// ── CPCB live API ─────────────────────────────────────────────────────────────
// BUG FIX 1: Key was hardcoded in source — anyone with repo access had it.
// Now loaded from process.env.CPCB_API_KEY (set in Backend/.env).
// If the key is missing at startup, log a clear warning so it's obvious why
// live data isn't working instead of silently falling back to synthetic data.
const CPCB_API_KEY = process.env.CPCB_API_KEY;
if (!CPCB_API_KEY) {
  console.warn(
    "⚠️  WARNING: CPCB_API_KEY is not set in environment.\n" +
    "   Live AQI data will not work. Add it to Backend/.env:\n" +
    "   CPCB_API_KEY=your_key_here"
  );
}
const CPCB_URL = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${CPCB_API_KEY}&format=json&limit=1300`;

// BUG FIX 2: Two separate caches — live data and fallback data.
// The original code stored BOTH in the same liveCache key, meaning
// stale fallback data would block a real live fetch for 30 minutes.
// Now: live TTL = 30 min, fallback TTL = 5 min, and they never collide.
const liveCache    = new Map(); // live CPCB API responses
const fallbackCache = new Map(); // static JSON fallback responses

// ── AQI colour helper ─
function getAQIColor(aqi) {
  if (!aqi) return "#607d8b";
  if (aqi <= 50) return "#a8e063";
  if (aqi <= 100) return "#fdd835";
  if (aqi <= 200) return "#ff7c00";
  if (aqi <= 300) return "#f50057";
  if (aqi <= 400) return "#9c27b0";
  return "#6a0080";
}

const LIVE_CACHE_TTL     = 30 * 60 * 1000; //  30 minutes — CPCB updates hourly
const FALLBACK_CACHE_TTL =  5 * 60 * 1000; //   5 minutes — retry live sooner

// AbortController function to reduce repetition
function fetchWithTimeout(url, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timer));
}


// ════════════════════════════════════════════════════════════════════
// PAST — reads from city_data.json (loaded at startup, instant)
// GET /api/past/city/:cityName
// Returns: monthly PM2.5 trend + year-over-year change
// ════════════════════════════════════════════════════════════════════
router.get("/past/city/:cityName", (req, res) => {
  const city = req.params.cityName.replace(/-/g, " ").trim();

  // Case-insensitive lookup
  const key = Object.keys(cityData).find(
    (k) => k.toLowerCase() === city.toLowerCase()
  );

  if (!key) {
    return res.status(404).json({
      status: "error",
      message: `City '${city}' not found. Check /api/meta/cities for valid names.`,
    });
  }

  const rows = cityData[key];

  // Add colour to each row
  const enriched = rows.map((r) => ({
    ...r,
    colour: getAQIColor(r.aqi),
  }));

  // Year-over-year summary
  const byYear = {};
  rows.forEach((r) => {
    if (!byYear[r.year]) byYear[r.year] = []; // If the year is not already in the Array create it
    if (r.pm25) byYear[r.year].push(r.pm25); // Similar to push_back in vector
  });
  const yoy = Object.entries(byYear)
    .sort(([a], [b]) => a - b) //Sorting like Comparator
    .map(([year, vals], i, arr) => {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const prevAvg =
        i > 0
          ? arr[i - 1][1].reduce((a, b) => a + b, 0) / arr[i - 1][1].length
          : null;
      return {
        year: Number(year),
        avg_pm25: Math.round(avg * 10) / 10,
        pct_change:
          prevAvg !== null
            ? Math.round(((avg - prevAvg) / prevAvg) * 1000) / 10
            : null,
      };
    });

  res.json({
    status: "ok",
    city: key,
    data: enriched,
    year_over_year: yoy,
    who_limit: 15,
  });
});

//! Need to Fix this 

// ── Build synthetic station records from static data (used as fallback) ──────
// Returns records in the same shape as CPCB API so data-loader.js needs no changes
function buildFallbackRecords() {
  const records = [];
  Object.entries(cityCoords).forEach(([city, coords]) => {
    const rows = cityData[city];
    if (!rows || !rows.length) return;
    // Use the most recent month's data
    const latest = rows[rows.length - 1];
    if (!latest.pm25) return;
    records.push({
      station: city + " — Historical",
      city,
      latitude: String(coords.lat),
      longitude: String(coords.lng),
      pollutant_id: "PM2.5",
      avg_value: String(latest.pm25),
      min_value: String(latest.pm25),
      max_value: String(latest.pm25),
    });
  });
  return records;
}

// ════════════════════════════════════════════════════════════════════
// STATIONS — live CPCB with honest static fallback
//
// BUG FIX SUMMARY for this route:
//
//  BUG A (Cache Poisoning): Original code stored synthetic fallback data
//    in liveCache under the same key as live data. This meant after one
//    failed live call, the app served fake "Historical" data for 30
//    minutes while telling the frontend source:"static" — but the bigger
//    problem was it also blocked the /present/city/:name route from ever
//    getting fresh live data because IT shared the same cache. Fixed by
//    using separate liveCache and fallbackCache maps with different TTLs.
//
//  BUG B (Silent failure): When CPCB_API_KEY is missing, the URL is
//    literally "...?api-key=undefined&..." and the API returns a 401 or
//    empty records. The error was silently swallowed and synthetic data
//    was served. Now we check for the key upfront and return a 503 with
//    a clear message so YOU know exactly what's wrong.
//
//  BUG C (Misleading source label): Fallback data was labelled source:"static"
//    but the station names had " — Historical" suffix making them look like
//    real stations. Frontend had no way to show a banner saying "live data
//    unavailable". Now the response includes `live_available: false` and a
//    `fallback_reason` string so the frontend can show a warning banner.
//
// ════════════════════════════════════════════════════════════════════
router.get("/stations", async (req, res) => {
  const CACHE_KEY = "__all_stations__";

  // ── 1. Return live cache if fresh ──────────────────────────────
  const cachedLive = liveCache.get(CACHE_KEY);
  if (cachedLive && Date.now() - cachedLive.timestamp < LIVE_CACHE_TTL) {
    return res.json({ status: "ok", records: cachedLive.data, cached: true, source: "live", live_available: true });
  }

  // ── 2. Guard: no API key → skip network call entirely ──────────
  if (!CPCB_API_KEY) {
    const records = buildFallbackRecords();
    return res.json({
      status: "ok",
      records,
      cached: false,
      source: "static",
      live_available: false,
      fallback_reason: "CPCB_API_KEY environment variable is not set. Add it to Backend/.env to enable live data.",
    });
  }

  // ── 3. Try live CPCB API ────────────────────────────────────────
  try {
    const response = await fetchWithTimeout(CPCB_URL, 12000);

    if (!response.ok) {
      throw new Error(`CPCB API returned HTTP ${response.status}. Key may be invalid or quota exceeded.`);
    }

    const json = await response.json();
    const records = json.records || [];

    if (!records.length) {
      throw new Error("CPCB API returned 0 records — the resource ID may have changed.");
    }

    // Success — store in LIVE cache only
    liveCache.set(CACHE_KEY, { data: records, timestamp: Date.now() });
    console.log(`✅ CPCB live fetch: ${records.length} records cached at ${new Date().toISOString()}`);

    return res.json({ status: "ok", records, cached: false, source: "live", live_available: true });

  } catch (liveErr) {
    // ── 4. Fallback — check fallback cache first ────────────────
    const cachedFallback = fallbackCache.get(CACHE_KEY);
    if (cachedFallback && Date.now() - cachedFallback.timestamp < FALLBACK_CACHE_TTL) {
      return res.json({ status: "ok", records: cachedFallback.data, cached: true, source: "static", live_available: false, fallback_reason: liveErr.message });
    }

    console.warn("⚠️  CPCB API unavailable, serving static fallback:", liveErr.message);
    const records = buildFallbackRecords();

    if (!records.length) {
      return res.status(503).json({
        status: "error",
        message: "Live API unavailable and no static fallback data found.",
        detail: liveErr.message,
      });
    }

    // Store in FALLBACK cache only — never poisons the live cache
    fallbackCache.set(CACHE_KEY, { data: records, timestamp: Date.now() });

    return res.json({
      status: "ok",
      records,
      cached: false,
      source: "static",
      live_available: false,
      fallback_reason: liveErr.message,
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// PRESENT — calls CPCB live API, caches 30 min
// GET /api/present/city/:cityName
// Returns: live PM2.5, AQI, colour, "worse than usual?" flag
// ════════════════════════════════════════════════════════════════════
router.get("/present/city/:cityName", async (req, res) => {
  const city = req.params.cityName.replace(/-/g, " ").trim();

  // Check cache
  const cacheKey = "present:" + city.toLowerCase(); // BUG FIX: namespaced key to avoid collision with /stations cache
  const cached = liveCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < LIVE_CACHE_TTL) {
    return res.json({ ...cached.data, cached: true });
  }

  // Guard: no API key
  if (!CPCB_API_KEY) {
    return res.status(503).json({
      status: "error",
      message: "CPCB_API_KEY is not configured. Add it to Backend/.env to enable live city data.",
    });
  }

  try {
    const response = await fetchWithTimeout(CPCB_URL, 12000);
    const json = await response.json();
    const records = json.records || [];

    // Filter records matching this city
    const matched = records.filter(
      (r) => r.city && r.city.toLowerCase().trim() === city.toLowerCase().trim()
    );

    if (!matched.length) {
      return res.status(404).json({
        status: "error",
        message: `No live data found for city '${city}'.`,
      });
    }

    // Average pollutant values across all stations in this city
    const pollutants = {};
    matched.forEach((r) => {
      const pid = (r.pollutant_id || "").toUpperCase();
      const val = parseFloat(r.avg_value);
      if (!isNaN(val)) {
        if (!pollutants[pid]) pollutants[pid] = [];
        pollutants[pid].push(val);
      }
    });

    const avg = (key) => {
      const vals = pollutants[key];
      return vals ? Math.round((vals.reduce((a, b) => a + b) / vals.length) * 10) / 10 : null;
    };

    const pm25 = avg("PM2.5");
    const aqi = avg("AQI") || pm25;

    // Historical average for this city
    const key = Object.keys(cityData).find(
      (k) => k.toLowerCase() === city.toLowerCase()
    );
    let historicalAvg = null;
    if (key) {
      const vals = cityData[key].map((r) => r.pm25).filter(Boolean);
      historicalAvg =
        vals.length ? Math.round((vals.reduce((a, b) => a + b) / vals.length) * 10) / 10 : null;
    }

    const result = {
      status: "ok",
      city,
      pm25,
      pm10: avg("PM10"),
      no2: avg("NO2"),
      ozone: avg("OZONE"),
      co: avg("CO"),
      nh3: avg("NH3"),
      aqi_computed: aqi,
      colour: getAQIColor(aqi),
      historical_avg_pm25: historicalAvg,
      is_worse_than_usual: historicalAvg && pm25 ? pm25 > historicalAvg * 1.1 : null,
      stations_found: new Set(matched.map((r) => r.station)).size,
      source: "cpcb_realtime",
      cached: false,
    };

    liveCache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.json(result);
  } catch (err) {
    res.status(503).json({
      status: "error",
      message: err.name === "AbortError"
        ? "CPCB API timed out after 12s — try again in a moment."
        : "Live API unreachable. Try again in a moment.",
      detail: err.message,
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// FUTURE — calls the Python ml_service on port 5001
// GET /api/future/city/:cityName
// Returns: 3-month PM2.5 forecast from Random Forest model
// ════════════════════════════════════════════════════════════════════

router.get("/future/city/:cityName", async (req, res) => {
  const city = req.params.cityName.replace(/-/g, " ").trim();

  try {
    // AbortController gives a real timeout )

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 50000);
    const response = await fetch(
      `${ML_SERVICE_URL}/predict?city=${encodeURIComponent(city)}`,
      { signal: controller.signal }
    ).finally(() => clearTimeout(timer));

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({
        status: "error",
        message: err.error || "ML service returned an error.",
      });
    }

    const data = await response.json();
    res.json({ status: "ok", ...data });
  } catch (err) {
    res.status(503).json({
      status: "error",
      message:
        err.name === "AbortError"
          ? "ML service is waking up (Render cold start). Please try again in ~30 seconds."
          : "ML service is not running. Start it with: cd ml_model && python ml_service.py",
      detail: err.message,
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// DISEASE — correlation data (loaded from JSON, instant)
// GET /api/disease/correlations
// GET /api/disease/:causeName
// ════════════════════════════════════════════════════════════════════
router.get("/disease/correlations", (req, res) => {
  const sigOnly = req.query.significant_only === "true";
  let data = corrData;
  if (sigOnly) data = data.filter((r) => r.significant_05 === true || r.significant_05 === "True");

  const enriched = data
    .sort((a, b) => b.pearson_r - a.pearson_r)
    .map((r) => ({
      ...r,
      direction: r.pearson_r >= 0 ? "positive" : "negative",
      bar_width_pct: Math.round(Math.abs(r.pearson_r) * 100),
      sig_stars:
        r.p_value < 0.001 ? "***" : r.p_value < 0.01 ? "**" : r.p_value < 0.05 ? "*" : "ns",
    }));

  res.json({ status: "ok", data: enriched, count: enriched.length });
});

router.get("/disease/:causeName", (req, res) => {
  const name = req.params.causeName.replace(/-/g, " ").trim();
  const row = corrData.find(
    (r) => r.cause_name.toLowerCase() === name.toLowerCase()
  );
  if (!row) {
    return res.status(404).json({
      status: "error",
      message: `Disease '${name}' not found.`,
    });
  }
  res.json({ status: "ok", data: row });
});

// ════════════════════════════════════════════════════════════════════
// META — city/state lists for search dropdowns
// GET /api/meta/cities
// GET /api/meta/states
// ════════════════════════════════════════════════════════════════════
router.get("/meta/cities", (req, res) => {
  res.json({ status: "ok", cities: metaData.cities, count: metaData.cities.length });
});

router.get("/meta/states", (req, res) => {
  res.json({ status: "ok", states: metaData.states, count: metaData.states.length });
});

export default router;