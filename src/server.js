// src/server.js

import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import cors from "cors";

import { validate } from "./validate.js";
import { RecommendSchema } from "./schema.js";
import { errorHandler } from "./error.js";
import { Restaurant } from "./models/restaurant.model.js";
import { Menu } from "./models/menu.model.js";
import { callAI } from "./aiClient.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MenuMate API",
      version: "1.0.0",
      description: "메뉴 추천 서비스 MenuMate의 API 문서입니다.",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
  },
  apis: ["./src/server.js"],
};

const specs = swaggerJsdoc(options);

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/health", (_, res) => res.json({ ok: true }));

/* mock 응답 (필요시 실제 AI 호출로 교체)
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
        longitude: 12.34,
      },
    ],
  };
}
  */

function buildAIInput(valid) {
    return {
        user: {
        category: valid.category,
        dietInfo: valid.dietInfo || null,
        campus: valid.campus || [],
        meals: valid.meals,
        price: valid.price || null,
        prompt: valid.prompt || "",
        },
    }
}

function transformResponse(rawMenusArray, requestedMeals) {
  const finalResponse = {
    recommendations: {},
  };

  if (!requestedMeals || requestedMeals.length === 0) {
    return finalResponse;
  }
  for (const meal of requestedMeals) {
    finalResponse.recommendations[meal] = [];
  }

  for (const item of rawMenusArray) {
    const transformedItem = {
      restaurant_name: item.restaurant_name,
      name: item.name,
      description: item.description,
      calories: item.calories,
      image_url: item.image_url,
      url: item.url,
      location: {
        latitude: item.latitude,
        longitude: item.longitude,
      },
    };

    const mealType = item.meals;
    if (finalResponse.recommendations[mealType]) {
      finalResponse.recommendations[mealType].push(transformedItem);
    }
  }

  return finalResponse;
}

app.post("/recommend", validate(RecommendSchema), async (req, res, next) => {
  try {
    // 1) schema.js 검증 통과된 값
    const valid = req.valid;

    // 2) AI에 보낼 JSON 만들기
    const aiInput = buildAIInput(valid);

    // 3) AI 서버 호출 (aiClient.js)
    const result = await callAI(aiInput);

    // 4) FE용 응답으로 가공
    const finalResponse = transformResponse(result.menus, req.valid.meals);

    // 5) FE에 응답
    res.status(200).json(finalResponse);
  } catch (e) {
    next(e);
  }
});

app.get("/api/restaurants", async (req, res, next) => {
  try {
    const restaurants = await Restaurant.findAll();
    res.json(restaurants);
  } catch (error) {
    next(error);
  }
});

app.get("/api/restaurants/:id/menus", async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`--- API CALL: /api/restaurants/${id}/menus ---`);
    const menus = await Menu.findByRestaurantId(id);
    console.log("--- DB RESULT:", menus);
    res.json(menus);
  } catch (error) {
    next(error);
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND", msg: "Route not found" });
});
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server http://localhost:${port}`));
