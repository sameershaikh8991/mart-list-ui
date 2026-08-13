// D-Mart list backend — Express + Neon Postgres (serverless driver)
//
// Setup:
//   1. npm install
//   2. Create a .env file with: DATABASE_URL=postgres://... (copy from your Neon dashboard)
//   3. Run schema.sql once in the Neon SQL editor to create the tables
//   4. npm start   (or deploy this folder to Vercel/Render)
//
// Endpoints:
//   POST /api/login          { name, mobile }              -> creates/returns user
//   GET  /api/items/:mobile                                -> list all items for a user
//   POST /api/items/:mobile   { name, category, qty, unit, price } -> add or increment item
//   PATCH /api/items/:mobile/:id  { qty?, price?, checked?, category?, skipped?, note? } -> update one item
//   DELETE /api/items/:mobile/:id -> remove one item
//   POST /api/items/:mobile/reset-trip -> clears checked + skipped + note for ALL items (start a new shopping trip)
//
// MIGRATION NEEDED (run once in Neon SQL editor before deploying this version):
//   ALTER TABLE items ADD COLUMN IF NOT EXISTS skipped boolean NOT NULL DEFAULT false;
//   ALTER TABLE items ADD COLUMN IF NOT EXISTS note text;

import express from "express";
import cors from "cors";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const sql = neon(process.env.DATABASE_URL);

// ---- users ----
app.post("/api/login", async (req, res) => {
  try {
    const { name, mobile } = req.body;
    if (!name || !mobile) return res.status(400).json({ error: "name and mobile are required" });
    const rows = await sql`
      INSERT INTO users (mobile, name) VALUES (${mobile}, ${name})
      ON CONFLICT (mobile) DO UPDATE SET name = EXCLUDED.name
      RETURNING mobile, name
    `;
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "login failed" });
  }
});

// ---- items ----
app.get("/api/items/:mobile", async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, name, category, qty, unit, price, checked, skipped, note
      FROM items WHERE mobile = ${req.params.mobile}
      ORDER BY created_at ASC
    `;
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "could not fetch items" });
  }
});

app.post("/api/items/:mobile", async (req, res) => {
  try {
    const { name, category = "Kitchen", qty = 1, unit = "packet", price = null } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const rows = await sql`
      INSERT INTO items (mobile, name, category, qty, unit, price)
      VALUES (${req.params.mobile}, ${name}, ${category}, ${qty}, ${unit}, ${price})
      ON CONFLICT (mobile, LOWER(name))
      DO UPDATE SET qty = items.qty + EXCLUDED.qty, updated_at = now()
      RETURNING id, name, category, qty, unit, price, checked, skipped, note
    `;
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "could not add item" });
  }
});


app.patch("/api/items/:mobile/:id", async (req, res) => {
  console.log("🔥🔥 PATCH ROUTE HIT");
  console.log("PARAMS:", req.params);
  console.log("BODY:", req.body);

  try {
    const { qty, price, checked, category, skipped, note } = req.body;

    console.log("🔥 SKIPPED VALUE:", skipped);

    const rows = await sql`
      UPDATE items SET
        qty = COALESCE(${qty}, qty),
        price = COALESCE(${price}, price),
        checked = COALESCE(${checked}, checked),
        skipped = COALESCE(${skipped}, skipped),
        note = COALESCE(${note}, note),
        category = COALESCE(${category}, category),
        updated_at = now()
      WHERE id = ${req.params.id}
        AND mobile = ${req.params.mobile}
      RETURNING *
    `;

    console.log("🔥 UPDATED ROW:", rows[0]);

    if (!rows[0]) {
      return res.status(404).json({ error: "item not found" });
    }

    res.json(rows[0]);

  } catch (e) {
    console.error("🔥 PATCH ERROR:", e);
    res.status(500).json({ error: "could not update item" });
  }
});

// Reset all items for a new shopping trip: clears checked + skipped + note
app.post("/api/items/:mobile/reset-trip", async (req, res) => {
  try {
    const rows = await sql`
      UPDATE items SET checked = false, skipped = false, note = NULL,qty =0,price = "", updated_at = now()
      WHERE mobile = ${req.params.mobile}
      RETURNING id, name, category, qty, unit, price, checked, skipped, note
    `;
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "could not reset trip" });
  }
});

app.delete("/api/items/:mobile/:id", async (req, res) => {
  try {
    await sql`DELETE FROM items WHERE id = ${req.params.id} AND mobile = ${req.params.mobile}`;
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "could not delete item" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`D-Mart backend running on port ${PORT}`));