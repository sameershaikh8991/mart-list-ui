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
//   PATCH /api/items/:mobile/:id  { qty?, price?, checked?, category? } -> update one item
//   DELETE /api/items/:mobile/:id -> remove one item

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
      SELECT id, name, category, qty, unit, price, checked
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
      RETURNING id, name, category, qty, unit, price, checked
    `;
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "could not add item" });
  }
});

app.patch("/api/items/:mobile/:id", async (req, res) => {
  try {
    const { qty, price, checked, category } = req.body;
    const rows = await sql`
      UPDATE items SET
        qty = COALESCE(${qty}, qty),
        price = COALESCE(${price}, price),
        checked = COALESCE(${checked}, checked),
        category = COALESCE(${category}, category),
        updated_at = now()
      WHERE id = ${req.params.id} AND mobile = ${req.params.mobile}
      RETURNING id, name, category, qty, unit, price, checked
    `;
    if (!rows[0]) return res.status(404).json({ error: "item not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "could not update item" });
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
