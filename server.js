const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "database", "reports.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function readReports() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "[]");
  } catch {
    return [];
  }
}
function writeReports(data) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.get("/api/reports", (req, res) => res.json(readReports()));

app.post("/api/reports", (req, res) => {
  const { name, type, title, message } = req.body || {};
  if (!name || !type || !title || !message) {
    return res.status(400).json({ ok:false, message:"Semua kolom wajib diisi." });
  }
  const reports = readReports();
  const report = {
    id: Date.now().toString(),
    name: String(name).slice(0, 60),
    type: type === "request" ? "request" : "bug",
    title: String(title).slice(0, 100),
    message: String(message).slice(0, 1500),
    status: "baru",
    createdAt: new Date().toISOString()
  };
  reports.unshift(report);
  writeReports(reports);
  res.json({ ok:true, report });
});

app.patch("/api/reports/:id", (req, res) => {
  const reports = readReports();
  const item = reports.find(x => x.id === req.params.id);
  if (!item) return res.status(404).json({ ok:false, message:"Laporan tidak ditemukan." });
  item.status = item.status === "selesai" ? "baru" : "selesai";
  writeReports(reports);
  res.json({ ok:true, report:item });
});

app.delete("/api/reports/:id", (req, res) => {
  const reports = readReports().filter(x => x.id !== req.params.id);
  writeReports(reports);
  res.json({ ok:true });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`PAYMENT MASERWIN aktif di port ${PORT}`));
