import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_PREFERENCES,
  type DietPreferences,
  type DietState,
  type LoggedMeal,
  type WeeklyDietPlan,
} from "./diet-types";

const STORAGE_KEY = "calz.diet-state.v1";
const EMPTY_STATE: DietState = {
  preferences: DEFAULT_PREFERENCES,
  weeklyPlan: null,
  meals: [],
};

let writeQueue: Promise<unknown> = Promise.resolve();

export async function loadDietState(): Promise<DietState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<DietState>;
    return {
      preferences: { ...DEFAULT_PREFERENCES, ...(parsed.preferences ?? {}) },
      weeklyPlan: parsed.weeklyPlan ?? null,
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

async function updateState(change: (current: DietState) => DietState): Promise<DietState> {
  const task = writeQueue.then(async () => {
    const current = await loadDietState();
    const next = change(current);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  });
  writeQueue = task.then(
    () => undefined,
    () => undefined,
  );
  return task;
}

export function savePreferences(preferences: DietPreferences): Promise<DietState> {
  return updateState((current) => ({ ...current, preferences }));
}

export function saveWeeklyPlan(weeklyPlan: WeeklyDietPlan): Promise<DietState> {
  return updateState((current) => ({ ...current, weeklyPlan }));
}

export function saveMeal(meal: LoggedMeal): Promise<DietState> {
  return updateState((current) => {
    const found = current.meals.some((item) => item.id === meal.id);
    const meals = found
      ? current.meals.map((item) => (item.id === meal.id ? meal : item))
      : [meal, ...current.meals];
    return { ...current, meals };
  });
}

export function deleteMeal(mealId: string): Promise<DietState> {
  return updateState((current) => ({
    ...current,
    meals: current.meals.filter((meal) => meal.id !== mealId),
  }));
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, offset: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

export function shortWeekday(date: Date): string {
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(date);
}

export function sumMeals(meals: LoggedMeal[]) {
  return meals.reduce(
    (total, meal) => ({
      calories: total.calories + meal.calories,
      protein: total.protein + meal.protein,
      carbohydrates: total.carbohydrates + meal.carbohydrates,
      fat: total.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
  );
}
