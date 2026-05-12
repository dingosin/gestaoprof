import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs-extra";
import multer from "multer";

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(process.cwd(), "data");
const TEACHERS_FILE = path.join(DATA_DIR, "dados_professores.json");
const BATCHES_FILE = path.join(DATA_DIR, "historico_lotes.json");
const OCCURRENCES_FILE = path.join(DATA_DIR, "ocorrencias.json");

// Ensure data directory and files exist
async function ensureData() {
  await fs.ensureDir(DATA_DIR);
  if (!(await fs.pathExists(TEACHERS_FILE))) {
    await fs.writeJson(TEACHERS_FILE, {});
  }
  if (!(await fs.pathExists(BATCHES_FILE))) {
    await fs.writeJson(BATCHES_FILE, {});
  }
  if (!(await fs.pathExists(OCCURRENCES_FILE))) {
    await fs.writeJson(OCCURRENCES_FILE, {});
  }
}

app.use(express.json());

// Setup multer for restore
const upload = multer({ dest: "uploads/" });

// API Routes
app.get("/api/data", async (req, res) => {
  try {
    const teachers = await fs.readJson(TEACHERS_FILE);
    const batches = await fs.readJson(BATCHES_FILE);
    const occurrences = await fs.readJson(OCCURRENCES_FILE);
    res.json({ teachers, batches, occurrences });
  } catch (error) {
    res.status(500).json({ error: "Erro ao ler dados" });
  }
});

app.post("/api/teachers", async (req, res) => {
  try {
    const { teachers } = req.body;
    await fs.writeJson(TEACHERS_FILE, teachers, { spaces: 4 });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar professores" });
  }
});

app.post("/api/batches", async (req, res) => {
  try {
    const { batches } = req.body;
    await fs.writeJson(BATCHES_FILE, batches, { spaces: 4 });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar histórico de lotes" });
  }
});

app.post("/api/occurrences", async (req, res) => {
  try {
    const { occurrences } = req.body;
    await fs.writeJson(OCCURRENCES_FILE, occurrences, { spaces: 4 });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar ocorrências" });
  }
});

app.get("/api/backup", async (req, res) => {
  try {
    const teachers = await fs.readJson(TEACHERS_FILE);
    const batches = await fs.readJson(BATCHES_FILE);
    const occurrences = await fs.readJson(OCCURRENCES_FILE);
    const backup = { teachers, batches, occurrences, timestamp: new Date().toISOString() };
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=backup-pedro-caminoto.json");
    res.send(JSON.stringify(backup, null, 2));
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar backup" });
  }
});

app.post("/api/restore", upload.single("backup"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    const backupContent = await fs.readJson(req.file.path);
    if (backupContent.teachers) {
      await fs.writeJson(TEACHERS_FILE, backupContent.teachers, { spaces: 4 });
    }
    if (backupContent.batches) {
      await fs.writeJson(BATCHES_FILE, backupContent.batches, { spaces: 4 });
    }
    if (backupContent.occurrences) {
      await fs.writeJson(OCCURRENCES_FILE, backupContent.occurrences, { spaces: 4 });
    }
    await fs.remove(req.file.path);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao restaurar backup" });
  }
});

async function start() {
  await ensureData();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
