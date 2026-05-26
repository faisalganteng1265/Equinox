import cors from "cors";
import "dotenv/config";
import express, { type Request, type Response } from "express";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Equinox API is running",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
  });
});

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
