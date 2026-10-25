import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BrandHeader, C, PageScroll, SectionHeading, SurfaceCard, Tag } from "@/components/diet-ui";
import { addDays, loadDietState, localDateKey, sumMeals } from "@/lib/diet-store";
import { type DietState, type LoggedMeal } from "@/lib/diet-types";

const blankState: DietState = {
  preferences: { goal: "feel-better", dietStyle: "balanced", allergies: "", dislikes: "", cuisine: "", mealsPerDay: 3 },
  weeklyPlan: null,
  meals: [],
};

function dayPlanIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function WeekBars({ meals }: { meals: LoggedMeal[] }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6)), []);
  const data = days.map((date) => {
    const dayMeals = meals.filter((meal) => meal.date === localDateKey(date));
    return { date, calories: sumMeals(dayMeals).calories };
  });
  const max = Math.max(700, ...data.map((item) => item.calories));
  return (
    <View style={styles.chartRow}>
      {data.map(({ date, calories }) => (
        <View key={localDateKey(date)} style={styles.chartCol}>
          <Text style={styles.chartValue}>{calories ? `${calories}` : "–"}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.bar, { height: calories ? Math.max(8, (calories / max) * 74) : 6 }]} />
          </View>
          <Text style={styles.chartDay}>{new Intl.DateTimeFormat("en", { weekday: "narrow" }).format(date)}</Text>
        </View>
      ))}
    </View>
  );
}

function MacroStat({ label, value, unit, tone }: { label: string; value: number; unit: string; tone: "green" | "coral" | "gold" }) {
  const background = tone === "green" ? C.greenPale : tone === "coral" ? C.coralPale : "#F9F1DA";
  const color = tone === "green" ? C.green : tone === "coral" ? C.coral : C.gold;
  return (
    <View style={[styles.macroStat, { backgroundColor: background }]}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}<Text style={styles.macroUnit}> {unit}</Text></Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [state, setState] = useState<DietState>(blankState);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadDietState().then((next) => { if (active) setState(next); });
      return () => { active = false; };
    }, []),
  );

  const today = new Date();
  const todayKey = localDateKey(today);
  const todaysMeals = state.meals.filter((meal) => meal.date === todayKey);
  const totals = sumMeals(todaysMeals);
  const weeklyDay = state.weeklyPlan?.days[dayPlanIndex(today)];
  const greeting = today.getHours() < 12
    ? "A bright start, whenever you're ready."
    : today.getHours() < 18
      ? "Good things grow one meal at a time."
      : "A little care goes a long way.";

  return (
    <PageScroll>
      <BrandHeader
        right={
          <View style={styles.datePill}>
            <MaterialIcons name="calendar-today" size={14} color={C.green} />
            <Text style={styles.datePillText}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(today)}</Text>
          </View>
        }
      />

      <View style={styles.intro}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.title}>Your day, <Text style={styles.titleAccent}>gently.</Text></Text>
        <Text style={styles.introCopy}>A little nourishment, a little progress — at your pace.</Text>
      </View>

      <Pressable onPress={() => router.push("/plan")} style={({ pressed }) => [styles.planHero, pressed && styles.pressed]}>
        <View style={styles.heroTop}>
          <Tag label="YOUR PERSONAL FOOD PLAN" icon="auto-awesome" tone="neutral" />
          <View style={styles.heroSpark}><MaterialIcons name="auto-awesome" size={20} color={C.greenDark} /></View>
        </View>
        <Text style={styles.heroTitle}>{state.weeklyPlan ? state.weeklyPlan.title : "A week that fits you."}</Text>
        <Text style={styles.heroCopy}>
          {state.weeklyPlan ? "Your seven-day plan is ready whenever you need a little inspiration." : "Tell Nutrolo what works for you. Your AI plan starts with your real-life preferences."}
        </Text>
        <View style={styles.heroLink}>
          <Text style={styles.heroLinkText}>{state.weeklyPlan ? "Open your plan" : "Make my plan"}</Text>
          <MaterialIcons name="arrow-forward" size={17} color={C.greenDark} />
        </View>
      </Pressable>

      <View>
        <SectionHeading title="Today at a glance" action="Add a meal" onAction={() => router.push("/journal")} />
        <SurfaceCard style={styles.todayCard}>
          <View style={styles.calorieLine}>
            <View>
              <Text style={styles.statKicker}>LOGGED TODAY</Text>
              <Text style={styles.calorieValue}>{Math.round(totals.calories).toLocaleString()} <Text style={styles.calorieUnit}>kcal</Text></Text>
            </View>
            <View style={styles.mealsBadge}>
              <MaterialIcons name="restaurant" size={17} color={C.green} />
              <Text style={styles.mealsBadgeText}>{todaysMeals.length} {todaysMeals.length === 1 ? "meal" : "meals"}</Text>
            </View>
          </View>
          <View style={styles.macroRow}>
            <MacroStat label="Protein" value={Math.round(totals.protein)} unit="g" tone="green" />
            <MacroStat label="Carbs" value={Math.round(totals.carbohydrates)} unit="g" tone="coral" />
            <MacroStat label="Fat" value={Math.round(totals.fat)} unit="g" tone="gold" />
          </View>
          <Text style={styles.estimateNote}>Nutrition totals are estimates from the meals you log.</Text>
        </SurfaceCard>
      </View>

      <View>
        <SectionHeading title="On your menu" action={weeklyDay ? "See week" : "Build a plan"} onAction={() => router.push("/plan")} />
        {weeklyDay ? (
          <SurfaceCard style={styles.menuCard}>
            <View style={styles.menuDayHeader}>
              <View>
                <Text style={styles.menuDay}>{weeklyDay.day}</Text>
                <Text style={styles.menuFocus}>{weeklyDay.focus}</Text>
              </View>
              <Tag label="AI PLAN" icon="auto-awesome" />
            </View>
            {weeklyDay.meals.slice(0, 3).map((meal, index) => (
              <View key={`${meal.name}-${index}`} style={styles.menuMeal}>
                <View style={styles.mealDot} />
                <View style={styles.menuMealBody}>
                  <Text style={styles.mealSlot}>{meal.slot}</Text>
                  <Text style={styles.mealName}>{meal.name}</Text>
                </View>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
              </View>
            ))}
          </SurfaceCard>
        ) : (
          <SurfaceCard style={styles.emptyCard}>
            <View style={styles.emptyIcon}><MaterialIcons name="restaurant-menu" size={22} color={C.green} /></View>
            <View style={styles.emptyBody}>
              <Text style={styles.emptyTitle}>Nothing planned yet</Text>
              <Text style={styles.emptyText}>Build a flexible week of meals with Nutrolo AI.</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={C.muted} />
          </SurfaceCard>
        )}
      </View>

      <View>
        <SectionHeading title="Your rhythm" action="Food log" onAction={() => router.push("/journal")} />
        <SurfaceCard style={styles.chartCard}>
          <Text style={styles.chartCaption}>Calories logged · last 7 days</Text>
          <WeekBars meals={state.meals} />
        </SurfaceCard>
      </View>

      <View>
        <SectionHeading title="Meals today" action={todaysMeals.length ? "View all" : undefined} onAction={() => router.push("/journal")} />
        {todaysMeals.length ? (
          <SurfaceCard style={styles.mealListCard}>
            {todaysMeals.slice(0, 3).map((meal, index) => (
              <View key={meal.id} style={[styles.mealListRow, index > 0 && styles.mealDivider]}>
                <View style={styles.mealListIcon}><MaterialIcons name="lunch-dining" size={18} color={C.green} /></View>
                <View style={styles.mealListText}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealMeta}>{meal.protein}g protein · {meal.carbohydrates}g carbs</Text>
                </View>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
              </View>
            ))}
          </SurfaceCard>
        ) : (
          <Pressable onPress={() => router.push("/journal")} style={({ pressed }) => [styles.addFirstMeal, pressed && styles.pressed]}>
            <MaterialIcons name="add-circle-outline" size={21} color={C.green} />
            <Text style={styles.addFirstMealText}>Log your first meal</Text>
            <MaterialIcons name="arrow-forward" size={17} color={C.green} />
          </Pressable>
        )}
      </View>
    </PageScroll>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 5, marginTop: 2 },
  greeting: { fontSize: 13, color: C.muted, fontWeight: "600" },
  title: { fontSize: 31, lineHeight: 37, color: C.ink, fontWeight: "900", letterSpacing: -1.1 },
  titleAccent: { color: C.green },
  introCopy: { fontSize: 13, lineHeight: 20, color: C.muted, maxWidth: 350 },
  datePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.surface, borderColor: C.line, borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 },
  datePillText: { color: C.ink, fontSize: 11, fontWeight: "800" },
  planHero: { backgroundColor: C.lime, borderRadius: 26, padding: 19, gap: 11, overflow: "hidden" },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroSpark: { width: 39, height: 39, backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 15, justifyContent: "center", alignItems: "center" },
  heroTitle: { color: C.greenDark, fontSize: 23, lineHeight: 28, fontWeight: "900", letterSpacing: -0.5, maxWidth: 330 },
  heroCopy: { color: C.greenDark, opacity: 0.83, fontSize: 13, lineHeight: 19, maxWidth: 360 },
  heroLink: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.62)", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, marginTop: 2 },
  heroLinkText: { color: C.greenDark, fontSize: 12, fontWeight: "900" },
  todayCard: { gap: 15 },
  calorieLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statKicker: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  calorieValue: { color: C.ink, fontSize: 30, lineHeight: 37, fontWeight: "900", letterSpacing: -0.7, marginTop: 1 },
  calorieUnit: { fontSize: 13, color: C.muted, fontWeight: "700", letterSpacing: 0 },
  mealsBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.greenPale, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 999 },
  mealsBadgeText: { color: C.green, fontSize: 11, fontWeight: "800" },
  macroRow: { flexDirection: "row", gap: 8 },
  macroStat: { flex: 1, minWidth: 0, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 10, gap: 4 },
  macroDot: { width: 6, height: 6, borderRadius: 99 },
  macroLabel: { color: C.muted, fontSize: 10, fontWeight: "700" },
  macroValue: { color: C.ink, fontSize: 17, fontWeight: "900" },
  macroUnit: { color: C.muted, fontSize: 10, fontWeight: "700" },
  estimateNote: { color: C.muted, fontSize: 10, lineHeight: 14 },
  menuCard: { padding: 16 },
  menuDayHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: 12 },
  menuDay: { color: C.ink, fontSize: 17, fontWeight: "900" },
  menuFocus: { color: C.muted, fontSize: 11, marginTop: 2 },
  menuMeal: { flexDirection: "row", alignItems: "center", gap: 10, borderTopColor: C.line, borderTopWidth: 1, paddingVertical: 12 },
  mealDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: C.coral },
  menuMealBody: { flex: 1, gap: 2 },
  mealSlot: { color: C.muted, fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  mealName: { color: C.ink, fontSize: 13, fontWeight: "800" },
  mealCalories: { color: C.muted, fontSize: 10, fontWeight: "700" },
  emptyCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 15 },
  emptyIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: C.greenPale, alignItems: "center", justifyContent: "center" },
  emptyBody: { flex: 1, gap: 3 },
  emptyTitle: { color: C.ink, fontSize: 13, fontWeight: "900" },
  emptyText: { color: C.muted, fontSize: 11, lineHeight: 16 },
  chartCard: { paddingBottom: 11 },
  chartCaption: { color: C.muted, fontSize: 11, marginBottom: 10 },
  chartRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 7 },
  chartCol: { flex: 1, alignItems: "center", gap: 5 },
  chartValue: { minHeight: 12, color: C.muted, fontSize: 8, fontWeight: "700" },
  barTrack: { width: "100%", height: 78, justifyContent: "flex-end", alignItems: "center", backgroundColor: C.background, borderRadius: 9, overflow: "hidden" },
  bar: { width: "65%", backgroundColor: C.green, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
  chartDay: { color: C.muted, fontSize: 9, fontWeight: "800" },
  mealListCard: { paddingHorizontal: 14, paddingVertical: 2 },
  mealListRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  mealDivider: { borderTopWidth: 1, borderTopColor: C.line },
  mealListIcon: { width: 36, height: 36, backgroundColor: C.greenPale, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  mealListText: { flex: 1, gap: 3 },
  mealMeta: { color: C.muted, fontSize: 10 },
  addFirstMeal: { minHeight: 52, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderStyle: "dashed", borderColor: C.green, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.6)" },
  addFirstMealText: { flex: 1, color: C.green, fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
