// src/aiClient.js
import "dotenv/config";

/**
 * body: AI 서버에 그대로 보낼 JSON 객체
 * 예: {
 *   user: {
 *     category: "DIET",
 *     dietInfo: { height: 165, weight: 50 },
 *     campus: ["humanities_campus"],
 *     meals: ["LUNCH"],
 *     price: { minPrice: 5000, maxPrice: 12000 },
 *     prompt: "고기 위주로 골라줘"
 *   }
 * }
 */
export async function callAI(body) {
  const endpoint = process.env.AI_ENDPOINT; // 예: http://localhost:4001/recommend

  if (!endpoint) {
    const e = new Error("AI_ENDPOINT is not set");
    e.status = 500;
    e.code = "AI_CONFIG_MISSING";
    throw e;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const e = new Error(`AI request failed: ${res.status} ${text}`);
    e.status = 502;
    e.code = "AI_BAD_GATEWAY";
    throw e;
  }

  // AI는 { menus: [...] } 형태로 응답한다고 가정
  return res.json();
}
