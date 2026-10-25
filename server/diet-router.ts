import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { publicProcedure, router } from "./_core/trpc";

const preferencesSchema = z.object({
  goal: z.enum(["feel-better", "gentle-weight-loss", "build-strength", "maintain"]),
  dietStyle: z.enum(["balanced", "vegetarian", "vegan", "mediterranean", "pescatarian", "high-protein"]),
  allergies: z.string().trim().max(200),
  dislikes: z.string().trim().max(200),
  cuisine: z.string().trim().max(80),
  mealsPerDay: z.union([z.literal(3), z.literal(4), z.literal(5)]),
});

const planSchema = z.object({
  title: z.string().min(3).max(100),
  overview: z.string().min(10).max(500),
  days: z.array(
    z.object({
      day: z.string().min(3).max(20),
      focus: z.string().min(3).max(100),
      meals: z.array(
        z.object({
          slot: z.string().min(2).max(30),
          name: z.string().min(2).max(100),
          ingredients: z.array(z.string().min(1).max(100)).min(2).max(12),
          preparation: z.string().min(5).max(300),
          calories: z.number().int().min(0).max(1800),
          protein: z.number().int().min(0).max(150),
          carbohydrates: z.number().int().min(0).max(250),
          fat: z.number().int().min(0).max(120),
        }),
      ),
    }),
  ),
  groceryList: z.array(z.string().min(1).max(100)).max(150),
});

const planJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    overview: { type: "string" },
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          focus: { type: "string" },
          meals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                slot: { type: "string" },
                name: { type: "string" },
                ingredients: { type: "array", items: { type: "string" } },
                preparation: { type: "string" },
                calories: { type: "integer" },
                protein: { type: "integer" },
                carbohydrates: { type: "integer" },
                fat: { type: "integer" },
              },
              required: ["slot", "name", "ingredients", "preparation", "calories", "protein", "carbohydrates", "fat"],
              additionalProperties: false,
            },
          },
        },
        required: ["day", "focus", "meals"],
        additionalProperties: false,
      },
    },
    groceryList: { type: "array", items: { type: "string" } },
  },
  required: ["title", "overview", "days", "groceryList"],
  additionalProperties: false,
};

const foodPhotoSchema = z.object({
  photoDataUri: z
    .string()
    .min(64)
    .max(900_000)
    .regex(/^data:image\/(?:jpeg|png|webp);base64,/i, "Choose a JPEG, PNG or WebP food photo."),
});

const foodAnalysisSchema = z.object({
  isFood: z.boolean(),
  foodName: z.string().min(2).max(120),
  components: z.array(z.string().min(1).max(80)).max(12),
  portion: z.string().min(2).max(120),
  description: z.string().min(5).max(300),
  confidence: z.enum(["low", "medium", "high"]),
  assumptions: z.string().max(400),
  calories: z.number().min(0).max(2500),
  protein: z.number().min(0).max(200),
  carbohydrates: z.number().min(0).max(300),
  fat: z.number().min(0).max(200),
  fiber: z.number().min(0).max(100),
  sugars: z.number().min(0).max(200),
  sodiumMg: z.number().min(0).max(15_000),
  micronutrients: z.object({
    calciumMg: z.number().min(0).max(5_000),
    ironMg: z.number().min(0).max(100),
    magnesiumMg: z.number().min(0).max(2_000),
    zincMg: z.number().min(0).max(100),
    potassiumMg: z.number().min(0).max(10_000),
    vitaminAMcgRAE: z.number().min(0).max(20_000),
    vitaminCMg: z.number().min(0).max(2_000),
    vitaminDMcg: z.number().min(0).max(250),
    vitaminEMg: z.number().min(0).max(500),
    vitaminKMcg: z.number().min(0).max(2_000),
    vitaminB12Mcg: z.number().min(0).max(1_000),
    folateMcgDFE: z.number().min(0).max(5_000),
  }).strict(),
}).strict();

const foodAnalysisJsonSchema = {
  type: "object",
  properties: {
    isFood: { type: "boolean" },
    foodName: { type: "string" },
    components: { type: "array", items: { type: "string" } },
    portion: { type: "string" },
    description: { type: "string" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    assumptions: { type: "string" },
    calories: { type: "number" },
    protein: { type: "number" },
    carbohydrates: { type: "number" },
    fat: { type: "number" },
    fiber: { type: "number" },
    sugars: { type: "number" },
    sodiumMg: { type: "number" },
    micronutrients: {
      type: "object",
      properties: {
        calciumMg: { type: "number" },
        ironMg: { type: "number" },
        magnesiumMg: { type: "number" },
        zincMg: { type: "number" },
        potassiumMg: { type: "number" },
        vitaminAMcgRAE: { type: "number" },
        vitaminCMg: { type: "number" },
        vitaminDMcg: { type: "number" },
        vitaminEMg: { type: "number" },
        vitaminKMcg: { type: "number" },
        vitaminB12Mcg: { type: "number" },
        folateMcgDFE: { type: "number" },
      },
      required: [
        "calciumMg",
        "ironMg",
        "magnesiumMg",
        "zincMg",
        "potassiumMg",
        "vitaminAMcgRAE",
        "vitaminCMg",
        "vitaminDMcg",
        "vitaminEMg",
        "vitaminKMcg",
        "vitaminB12Mcg",
        "folateMcgDFE",
      ],
      additionalProperties: false,
    },
  },
  required: [
    "isFood",
    "foodName",
    "components",
    "portion",
    "description",
    "confidence",
    "assumptions",
    "calories",
    "protein",
    "carbohydrates",
    "fat",
    "fiber",
    "sugars",
    "sodiumMg",
    "micronutrients",
  ],
  additionalProperties: false,
};

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part): part is { type: string; text: string } =>
        !!part && typeof part === "object" && "text" in part && typeof part.text === "string",
      )
      .map((part) => part.text)
      .join("\n");
  }
  return "";
}

export const dietRouter = router({
  generatePlan: publicProcedure.input(preferencesSchema).mutation(async ({ input }) => {
    try {
      const result = await invokeLLM({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Nutrolo, a practical meal-planning assistant. Create safe, balanced everyday meal ideas using the provided preferences. This is general wellness information, not medical advice: never diagnose or treat illness, never prescribe supplements, never recommend extreme restriction, crash dieting, fasting or very low calories. Respect stated diet style and exclude every listed allergy and disliked ingredient from every meal. You cannot guarantee food is allergen-free; include a brief reminder to check labels. Return exactly seven days, with the requested number of meals in each day. Use familiar ingredients, concise preparation steps, and realistic approximate nutrition estimates. Do not add personal details or any properties beyond the requested JSON schema.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Create a seven-day meal plan for this user.",
              preferences: input,
              dayNames: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
              nutritionNote: "Calories and macronutrients are estimates per meal; keep meals balanced and do not set a total daily calorie prescription.",
            }),
          },
        ],
        reasoning: { effort: "minimal" },
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "nutrolo_weekly_diet_plan",
            strict: true,
            schema: planJsonSchema,
          },
        },
      });

      const text = extractText(result.choices?.[0]?.message?.content);
      if (!text.trim()) throw new Error("Empty model response");

      const parsed = planSchema.parse(JSON.parse(text));
      if (parsed.days.length !== 7 || parsed.days.some((day) => day.meals.length !== input.mealsPerDay)) {
        throw new Error("Unexpected plan length");
      }

      return { ...parsed, createdAt: new Date().toISOString() };
    } catch (error) {
      console.error("Nutrolo plan generation failed", error instanceof Error ? error.message : "unknown error");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Your plan could not be created just now. Please check your connection and try again.",
      });
    }
  }),

  analyzeFood: publicProcedure.input(foodPhotoSchema).mutation(async ({ input }) => {
    try {
      const result = await invokeLLM({
        model: "gpt-6-luna",
        reasoning: { effort: "none" },
        messages: [
          {
            role: "system",
            content:
              "You are Nutrolo, a careful food-photo assistant. Identify only foods that are reasonably visible. Estimate the edible portion shown and nutrition for that whole visible serving using typical food-composition references as rough guides. Never claim laboratory accuracy, never diagnose, and never give medical treatment advice. Do not invent hidden ingredients; list uncertainty and assumptions. Food and micronutrient values from an image are always rough estimates, especially when the recipe, cooking method or portion is unclear. Return low confidence when identification or portion is uncertain. If the image is not food or no food can be identified, set isFood=false, foodName='Unclear', components=[], and all nutrient numbers to zero. Return exactly the requested JSON schema.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this one meal photo. Name the most likely dish and visible components, estimate the portion and provide per-serving calories, protein, carbohydrates, fat, fiber, sugars, sodium and the listed micronutrients. Use realistic rounded estimates, not false precision. If you cannot confidently tell what food is shown, mark it as not identifiable rather than guessing.",
              },
              {
                type: "image_url",
                image_url: { url: input.photoDataUri, detail: "high" },
              },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "nutrolo_food_photo_analysis",
            strict: true,
            schema: foodAnalysisJsonSchema,
          },
        },
      });

      const text = extractText(result.choices?.[0]?.message?.content);
      if (!text.trim()) throw new Error("Empty model response");
      const analysis = foodAnalysisSchema.parse(JSON.parse(text));
      if (!analysis.isFood) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "I couldn’t confidently identify food in this photo. Try a clearer meal photo or enter the nutrition manually.",
        });
      }
      return analysis;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Nutrolo food photo analysis failed", error instanceof Error ? error.message : "unknown error");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Nutrolo couldn’t analyze this photo right now. You can try again or enter the nutrition manually.",
      });
    }
  }),
});
