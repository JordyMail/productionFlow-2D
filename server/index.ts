// server/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import templateRoutes from "./routes/templates";
import flowSaveRoutes from "./routes/flowSaves"; // NEW

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
  origin: [
    'http://localhost:8080',      // productionFlow-2D dev
    'http://localhost:3000',      // Server production
    'http://localhost:5173',      // SWS app dev (sesuaikan dengan port SWS)
    'http://10.125.20.42:3000',   // Server IP (jika SWS akses via IP)
    // Tambahkan origin aplikasi SWS
  ],
  credentials: true,
}));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.use("/api/templates", templateRoutes);
  app.use("/api/flow-saves", flowSaveRoutes); // NEW

  app.get("/api/health", async (_req, res) => {
    try {
      const { checkConnection } = await import("./db/connection");
      const isConnected = await checkConnection();
      res.json({
        status: "ok",
        database: isConnected ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return app;
}