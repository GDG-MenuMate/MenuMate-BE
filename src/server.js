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
import { callAI, checkAIHealth } from "./aiClient.js";

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

// AI 서버 상태 캐시 (최신 상태 유지)
let aiServerStatus = { available: false, lastChecked: null };

// AI 서버 상태 확인 함수
async function updateAIServerStatus() {
  try {
    const status = await checkAIHealth();
    aiServerStatus = {
      ...status,
      lastChecked: new Date().toISOString(),
    };
    return status;
  } catch (error) {
    aiServerStatus = {
      available: false,
      error: error.message,
      lastChecked: new Date().toISOString(),
    };
    return aiServerStatus;
  }
}

// Health check 엔드포인트 - 백엔드 및 AI 서버 상태 확인
app.get("/health", async (_, res) => {
  const aiStatus = await updateAIServerStatus();
  
  res.json({
    backend: { ok: true },
    aiServer: aiStatus,
  });
});

//mock 응답 (필요시 실제 AI 호출로 교체)
async function mockRecommend(_input) {
  return {
    morning: null, // 아침은 추천 결과가 없는 경우 예시

    lunch: {
      restaurant_name: "샐러디 고대안암점",
      menu_name: "더블 삼겹 박스",
      price: 8500,
      justification:
        "든든한 밥 종류를 찾으시는 요청에 맞춰, 자연계 캠퍼스 근처의 한식당 B에서 판매하는 제육볶음을 추천합니다.",
      new_score: 0.95,
      reason_hashtags: ["#든든한", "#밥", "#고기"],
    },

    dinner: {
      restaurant_name: "샐러디 고대안암점",
      menu_name: "더블 삼겹 박스",
      price: 9000,
      justification:
        "저녁 식사로는 든든한 국물이 있는 라멘을 추천합니다. 높은 평점을 받고 있습니다.",
      new_score: 0.92,
      reason_hashtags: ["#국물", "#면", "#높은평점"],
    },
  };
}

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
  };
}

async function transformResponse(aiResult) {
  const finalResponse = {
    recommendations: {},
  };

  const processItem = async (aiItem) => {
    if (!aiItem) return null;

    let dbData = null;
    try {
      dbData = await Menu.findDetailByNames(
        aiItem.restaurant_name,
        aiItem.menu_name
      );
    } catch (e) {
      console.warn(
        `[Warning] DB lookup failed for ${aiItem.menu_name}: ${e.message}`
      );
    }

    return {
      restaurant_name: aiItem.restaurant_name,
      name: aiItem.menu_name,
      description:
        aiItem.justification || dbData?.description || "AI 추천 메뉴입니다.",
      price: dbData?.price || aiItem.price,
      calories: dbData?.calories || "",
      url: dbData?.restaurant_url || "",
      location: {
        latitude: dbData?.latitude || 0,
        longitude: dbData?.longitude || 0,
      },
    };
  };

  const [breakfast, lunch, dinner] = await Promise.all([
    aiResult.morning ? processItem(aiResult.morning) : null,
    aiResult.lunch ? processItem(aiResult.lunch) : null,
    aiResult.dinner ? processItem(aiResult.dinner) : null,
  ]);

  if (breakfast) finalResponse.recommendations.BREAKFAST = [breakfast];
  if (lunch) finalResponse.recommendations.LUNCH = [lunch];
  if (dinner) finalResponse.recommendations.DINNER = [dinner];

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
    // mock test (개발/테스트용)
    // const mockResponse = await mockRecommend(valid);

    // 4) FE용 응답으로 가공
    const finalResponse = await transformResponse(result);

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
app.listen(port, async () => {
  console.log(`Server http://localhost:${port}`);
  
  // 서버 시작 시 AI 서버 연결 테스트
  console.log("\n AI 서버 연결 확인 중...");
  const aiStatus = await updateAIServerStatus();
  
  if (aiStatus.available) {
    console.log("AI 서버 연결 성공!");
    /* if (process.env.AI_ENDPOINT) {
      console.log(`   엔드포인트: ${process.env.AI_ENDPOINT}`);
    } */
  } else {
    console.log("AI 서버 연결 실패");
    console.log(`   오류: ${aiStatus.error || "알 수 없는 오류"}`);
    if (!process.env.AI_ENDPOINT) {
      console.log("   AI_ENDPOINT 환경 변수가 설정되지 않았습니다.");
    }
  }
  console.log("");
});
