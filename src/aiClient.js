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
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true", // ngrok 브라우저 경고 스킵
    },
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

/**
 * AI 서버 상태 확인 (health check)
 */
export async function checkAIHealth() {
  const endpoint = process.env.AI_ENDPOINT;
  
  if (!endpoint) {
    return {
      available: false,
      error: "AI_ENDPOINT is not set",
    };
  }

  // AI 서버의 /health 엔드포인트 확인
  const baseUrl = endpoint.replace("/recommend", "");
  const healthUrl = `${baseUrl}/health`;

  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        available: true,
        status: res.status,
        response: data,
      };
    } else {
      return {
        available: false,
        status: res.status,
        error: `AI server returned ${res.status}`,
      };
    }
  } catch (error) {
    return {
      available: false,
      error: error.message,
    };
  }
}
