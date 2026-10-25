export type DietGoal = "feel-better" | "gentle-weight-loss" | "build-strength" | "maintain";
export type DietStyle =
  | "balanced"
  | "vegetarian"
  | "vegan"
  | "mediterranean"
  | "pescatarian"
  | "high-protein";
export type MealCount = 3 | 4 | 5;

export type DietPreferences = {
  goal: DietGoal;
  dietStyle: DietStyle;
  allergies: string;
  dislikes: string;
  cuisine: string;
  mealsPerDay: MealCount;
};

export type PlannedMeal = {
  slot: string;
  name: string;
  ingredients: string[];
  preparation: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
};

export type PlannedDay = {
  day: string;
  focus: string;
  meals: PlannedMeal[];
};

export type WeeklyDietPlan = {
  title: string;
  overview: string;
  days: PlannedDay[];
  groceryList: string[];
  createdAt: string;
};

export type FoodAnalysis = {
  isFood: boolean;
  foodName: string;
  components: string[];
  portion: string;
  description: string;
  confidence: "low" | "medium" | "high";
  assumptions: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugars: number;
  sodiumMg: number;
  micronutrients: {
    calciumMg: number;
    ironMg: number;
    magnesiumMg: number;
    zincMg: number;
    potassiumMg: number;
    vitaminAMcgRAE: number;
    vitaminCMg: number;
    vitaminDMcg: number;
    vitaminEMg: number;
    vitaminKMcg: number;
    vitaminB12Mcg: number;
    folateMcgDFE: number;
  };
};

export type LoggedMeal = {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  photoDataUri?: string;
  analysis?: FoodAnalysis;
  createdAt: string;
};

export type DietState = {
  preferences: DietPreferences;
  weeklyPlan: WeeklyDietPlan | null;
  meals: LoggedMeal[];
};

export const DEFAULT_PREFERENCES: DietPreferences = {
  goal: "feel-better",
  dietStyle: "balanced",
  allergies: "",
  dislikes: "",
  cuisine: "",
  mealsPerDay: 3,
};

export const DIET_GOALS: { value: DietGoal; label: string }[] = [
  { value: "feel-better", label: "Feel better" },
  { value: "gentle-weight-loss", label: "Gentle weight loss" },
  { value: "build-strength", label: "Build strength" },
  { value: "maintain", label: "Maintain" },
];

export const DIET_STYLES: { value: DietStyle; label: string }[] = [
  { value: "balanced", label: "Balanced" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "high-protein", label: "High protein" },
];
