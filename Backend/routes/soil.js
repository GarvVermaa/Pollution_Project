"use strict";
import express from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load soil_data.json once at startup
const RAW = JSON.parse(
  readFileSync(join(__dirname, "../data/soil_data.json"), "utf-8"),
);

// ── Build flat district list for easy querying ──────────────────────
// soil_data.json structure:
// { "STATE NAME": { state_code, districts: [ { district, district_code, cycles:{...} } ] } }
function buildFlatList() {
  const list = [];
  for (const [stateName, stateObj] of Object.entries(RAW)) {
    for (const d of stateObj.districts || []) {
      list.push({
        state_name: stateName,
        state_code: stateObj.state_code,
        district: d.district,
        district_code: d.district_code,
        cycles: d.cycles || {},
      });
    }
  }
  return list;
}

const FLAT = buildFlatList();

// ── GET /api/soil/states ─────────────────────────────────────────────
// Returns all state names + codes
router.get("/states", (req, res) => {
  const states = Object.entries(RAW).map(([name, obj]) => ({
    state_name: name,
    state_code: obj.state_code,
  }));
  res.json({ status: "ok", count: states.length, states });
});

// ── GET /api/soil/districts?state=BIHAR ─────────────────────────────
router.get("/districts", (req, res) => {
  const state = (req.query.state || "").toUpperCase();
  if (!state)
    return res
      .status(400)
      .json({ status: "error", message: "state param required" });

  const stateObj = RAW[state];
  if (!stateObj)
    return res
      .status(404)
      .json({ status: "error", message: "State not found" });

  const districts = (stateObj.districts || []).map((d) => ({
    district: d.district,
    district_code: d.district_code,
  }));
  res.json({ status: "ok", state, count: districts.length, districts });
});

// ── GET /api/soil/all ────────────────────────────────────────────────
// Returns all districts with all cycle data (used by frontend soil-loader)
router.get("/all", (req, res) => {
  res.json({ status: "ok", count: FLAT.length, data: FLAT });
});

// ── GET /api/soil/data?state=UP&cycle=2024-25 ────────────────────────
router.get("/data", (req, res) => {
  try {
    const stateFilter = (req.query.state || "").toUpperCase();
    const cycleFilter = req.query.cycle || null;
    const paramFilter = req.query.parameter || null;

    let results = FLAT;
    if (stateFilter)
      results = results.filter((d) => d.state_name === stateFilter);

    const out = results.map((d) => {
      let cycles = d.cycles;

      // filter to single cycle if requested
      if (cycleFilter) {
        cycles = cycles[cycleFilter]
          ? { [cycleFilter]: cycles[cycleFilter] }
          : {};
      }

      // filter to single parameter inside each cycle
      if (paramFilter) {
        cycles = Object.fromEntries(
          Object.entries(cycles)
            .map(([c, params]) => [
              c,
              params && params[paramFilter]
                ? { [paramFilter]: params[paramFilter] }
                : null,
            ])
            .filter(([, v]) => v),
        );
      }

      return {
        state_name: d.state_name,
        state_code: d.state_code,
        district: d.district,
        district_code: d.district_code,
        cycles,
      };
    });

    res.json({ status: "ok", count: out.length, data: out });
  } catch (err) {
    res.status(503).json({ status: "error", message: err.message });
  }
});

// ── GET /api/soil/district/:code ─────────────────────────────────────
router.get("/district/:code", (req, res) => {
  const d = FLAT.find(
    (x) => String(x.district_code) === String(req.params.code),
  );
  if (!d)
    return res
      .status(404)
      .json({ status: "error", message: "District not found" });
  res.json({ status: "ok", data: d });
});

// ── GET /api/soil/summary?state=UP ──────────────────────────────────
router.get("/summary", (req, res) => {
  try {
    const stateFilter = (req.query.state || "").toUpperCase();
    const cycleFilter = req.query.cycle || null;

    let source = FLAT;
    if (stateFilter)
      source = source.filter((d) => d.state_name === stateFilter);

    const counts = {};
    source.forEach((d) => {
      const cyclesToCheck = cycleFilter
        ? d.cycles[cycleFilter]
          ? { [cycleFilter]: d.cycles[cycleFilter] }
          : {}
        : d.cycles;

      Object.values(cyclesToCheck).forEach((cycleData) => {
        if (!cycleData) return;
        Object.entries(cycleData).forEach(([param, info]) => {
          if (!info) return;
          if (!counts[param])
            counts[param] = { Low: 0, Medium: 0, High: 0, total: 0 };
          counts[param][info.status] = (counts[param][info.status] || 0) + 1;
          counts[param].total++;
        });
      });
    });

    const summary = Object.entries(counts).map(([param, c]) => ({
      parameter: param,
      Low: c.Low || 0,
      Medium: c.Medium || 0,
      High: c.High || 0,
      total: c.total,
      low_pct: c.total ? Math.round((c.Low / c.total) * 100) : 0,
      medium_pct: c.total ? Math.round((c.Medium / c.total) * 100) : 0,
      high_pct: c.total ? Math.round((c.High / c.total) * 100) : 0,
    }));

    res.json({
      status: "ok",
      state: stateFilter || "ALL",
      count: source.length,
      parameters: summary,
    });
  } catch (err) {
    res.status(503).json({ status: "error", message: err.message });
  }
});

export default router;
