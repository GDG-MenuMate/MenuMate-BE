// src/schema.js
import { z } from "zod";

export const RecommendSchema = z.object({
  category: z.enum(["DIET","VEGETARIAN","LOW_SUGAR","HALAL"]).optional(),
  dietInfo: z.object({
    height: z.coerce.number().int().nonnegative().optional(),
    weight: z.coerce.number().int().nonnegative().optional()
  }).optional(),
  campus: z.array(z.string()).optional(),
  meals: z.array(z.enum(["BREAKFAST","LUNCH","DINNER"]))
          .min(1, "meals 배열은 최소 1개 이상이어야 합니다."),
  price: z.object({
    minPrice: z.coerce.number().int().nonnegative().optional(),
    maxPrice: z.coerce.number().int().nonnegative().optional()
  }).optional(),
  prompt: z.string().optional()
}).superRefine((v, ctx) => {
  if (!v.category && !v.prompt) {
    ctx.addIssue({ code: "custom", message: JSON.stringify({
      error: "MISSING_REQUIREMENT", msg: "카테고리 혹은 프롬프트를 입력해주세요."
    })});
  }
  if (v.category === "DIET" && !v.dietInfo) {
    ctx.addIssue({ code: "custom", message: JSON.stringify({
      error: "MISSING_DIET_TYPE", msg: "다이어트 식단 선택 시 키, 몸무게 작성이 필수입니다."
    })});
  }
  if (v.dietInfo) {
    const { height, weight } = v.dietInfo;
    // height와 weight가 있을 때만 범위 검증
    if (height != null && (height < 100 || height > 250)) {
      ctx.addIssue({ code: "custom", message: JSON.stringify({
        error: "INVALID_DIET_TYPE", msg: "키 입력 값을 다시 확인해주세요. (100-250cm)"
      })});
    }
    if (weight != null && (weight < 30 || weight > 300)) {
      ctx.addIssue({ code: "custom", message: JSON.stringify({
        error: "INVALID_DIET_TYPE", msg: "몸무게 입력 값을 다시 확인해주세요. (30-300kg)"
      })});
    }
  }
  if (v.price?.minPrice != null && v.price?.maxPrice != null && v.price.minPrice > v.price.maxPrice) {
    ctx.addIssue({ code: "custom", message: JSON.stringify({
      error: "INVALID_PRICE_RANGE", msg: "minPrice는 maxPrice보다 클 수 없습니다."
    })});
  }
});
