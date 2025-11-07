// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { validate } from "./validate.js";
import { RecommendSchema } from "./schema.js";
import { errorHandler } from "./error.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));

// mock 응답 (필요시 실제 AI 호출로 교체)
async function mockRecommend(_input) {
  return {
    menus: [
      {
        restaurant_name: "샐러디",
        name: "닭가슴살 샐러드",
        description: "...",
        meals: "LUNCH",
        calories: 350,
        image_url: "https://example.com/salad.jpg",
        url: "https://example.com",
        latitude: 12.34, 
        longitude: 12.34
      }
    ]
  };
}

app.post("/recommend", validate(RecommendSchema), async (req, res, next) => {
  try {
    const aiInput = { user: req.valid, candidates: [] }; // 추후 후보 필터 추가 가능
    const result = await mockRecommend(aiInput);
    res.json({ success: true, menus: result.menus });
  } catch (e) { next(e); }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND", msg: "Route not found" });
});
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server http://localhost:${port}`));
