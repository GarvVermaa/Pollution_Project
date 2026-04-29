import express from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load soil_data.json once at startup with error handling
let RAW = {};
let FLAT = [];

try {
 RAW = JSON.parse(
   readFileSync(join(__dirname, "../data/soil_data.json"), "utf-8"),
 );
 // Build flat district list for easy querying
 FLAT = buildFlatList();
} catch (err) {
 console.error("❌ Error loading soil data:", err.message);
 // Continue with empty data to prevent server crash
}

// ── Build flat district list for easy querying ──────────────────────
function buildFlatList() {
 try {
   const list = [];
   for (const [stateName, stateObj] of Object.entries(RAW)) {
     if (!stateObj || !stateObj.districts) {
       console.warn(`⚠️ Invalid soil data structure for state: ${stateName}`);
       continue;
     }
     for (const d of stateObj.districts || []) {
       if (!d || !d.district) {
         console.warn(`⚠️ Invalid district data in ${stateName}`);
         continue;
       }
       list.push({
         state_name: stateName,
         state_code: stateObj.state_code || "UNKNOWN",
         district: d.district,
         district_code: d.district_code || "UNKNOWN",
         cycles: d.cycles || {},
       });
     }
   }
   return list;
 } catch (err) {
   console.error("❌ Error building flat list:", err.message);
   return [];
 }
}

// ════════════════════════════════════════════════════════════════
// GET /api/soil/states
// Returns all state names + codes
// ════════════════════════════════════════════════════════════════
router.get("/states", (req, res, next) => {
 try {
   const states = Object.entries(RAW).map(([name, obj]) => ({
     state_name: name,
     state_code: obj.state_code || "UNKNOWN",
   }));
   res.json({ status: "ok", count: states.length, states });
 } catch (err) {
   next(err);
 }
});

// ════════════════════════════════════════════════════════════════
// GET /api/soil/districts?state=BIHAR
// ════════════════════════════════════════════════════════════════
router.get("/districts", (req, res, next) => {
 try {
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
     district_code: d.district_code || "UNKNOWN",
   }));
   res.json({ status: "ok", state, count: districts.length, districts });
 } catch (err) {
   next(err);
 }
});

// ════════════════════════════════════════════════════════════════
// GET /api/soil/all
// Returns all districts with all cycle data (used by frontend soil-loader)
// ════════════════════════════════════════════════════════════════
router.get("/all", (req, res, next) => {
 try {
   if (!FLAT.length) {
     return res.status(503).json({
       status: "error",
       message: "Soil data is not available"
     });
   }
   res.json({ status: "ok", count: FLAT.length, data: FLAT });
 } catch (err) {
   next(err);
 }
});

// ════════════════════════════════════════════════════════════════
// GET /api/soil/data?state=UP&cycle=2024-25
// ════════════════════════════════════════════════════════════════
router.get("/data", (req, res, next) => {
 try {
   const stateFilter = (req.query.state || "").toUpperCase();
   const cycleFilter = req.query.cycle || null;
   const paramFilter = req.query.parameter || null;

   if (!FLAT.length) {
     return res.status(503).json({
       status: "error",
       message: "Soil data is not available"
     });
   }

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
   next(err);
 }
});

// ════════════════════════════════════════════════════════════════
// GET /api/soil/district/:code
// ════════════════════════════════════════════════════════════════
router.get("/district/:code", (req, res, next) => {
 try {
   if (!FLAT.length) {
     return res.status(503).json({
       status: "error",
       message: "Soil data is not available"
     });
   }

   const d = FLAT.find(
     (x) => String(x.district_code) === String(req.params.code),
   );
   if (!d)
     return res
       .status(404)
       .json({ status: "error", message: "District not found" });
   res.json({ status: "ok", data: d });
 } catch (err) {
   next(err);
 }
});

// ════════════════════════════════════════════════════════════════
// GET /api/soil/summary?state=UP
// ════════════════════════════════════════════════════════════════
router.get("/summary", (req, res, next) => {
 try {
   if (!FLAT.length) {
     return res.status(503).json({
       status: "error",
       message: "Soil data is not available"
     });
   }

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
         if (!info || !info.status) return;
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
   next(err);
 }
});

export default router;