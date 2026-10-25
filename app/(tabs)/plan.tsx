import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { C, ChoiceChip, Field, PageHeading, PageScroll, PrimaryButton, ScreenFrame, SurfaceCard, Tag } from "@/components/diet-ui";
import { loadDietState, savePreferences, saveWeeklyPlan } from "@/lib/diet-store";
import { DEFAULT_PREFERENCES, DIET_GOALS, DIET_STYLES, type DietPreferences, type DietState, type MealCount, type PlannedDay, type PlannedMeal } from "@/lib/diet-types";
import { trpc } from "@/lib/trpc";

const blankState: DietState = { preferences: DEFAULT_PREFERENCES, weeklyPlan: null, meals: [] };
const MEAL_COUNTS: MealCount[] = [3, 4, 5];

function ChoiceGroup<T extends string | number>({
  label,
  values,
  selected,
  onChange,
  display,
}: {
  label: string;
  values: T[];
  selected: T;
  onChange: (value: T) => void;
  display?: (value: T) => string;
}) {
  return (
    <View style={styles.choiceGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={styles.chips}>
        {values.map((value) => {
          const option = display ? display(value) : String(value);
          const labelText = label === "Meals each day" ? `${option} meals` : option;
          return <ChoiceChip key={String(value)} label={labelText} selected={selected === value} onPress={() => onChange(value)} />;
        })}
      </View>
    </View>
  );
}

function PlanMealCard({ meal, index }: { meal: PlannedMeal; index: number }) {
  const icons = ["free-breakfast", "lunch-dining", "dinner-dining", "local-cafe", "bakery-dining"] as const;
  return (
    <SurfaceCard style={styles.planMealCard}>
      <View style={styles.planMealTop}>
        <View style={styles.planMealIcon}><MaterialIcons name={icons[index % icons.length]} size={19} color={C.green} /></View>
        <View style={styles.planMealNameWrap}>
          <Text style={styles.planMealSlot}>{meal.slot}</Text>
          <Text style={styles.planMealName}>{meal.name}</Text>
        </View>
        <Text style={styles.planKcal}>{meal.calories}<Text style={styles.planKcalUnit}> kcal</Text></Text>
      </View>
      <Text style={styles.planDescription}>{meal.preparation}</Text>
      <Text style={styles.ingredients}>{meal.ingredients.join(" · ")}</Text>
      <View style={styles.planMacros}>
        <Text style={styles.planMacro}><Text style={styles.bold}>{meal.protein}g</Text> protein</Text>
        <Text style={styles.planMacro}><Text style={styles.bold}>{meal.carbohydrates}g</Text> carbs</Text>
        <Text style={styles.planMacro}><Text style={styles.bold}>{meal.fat}g</Text> fat</Text>
      </View>
    </SurfaceCard>
  );
}

function DayPlan({ day }: { day: PlannedDay }) {
  return (
    <View style={styles.dayWrap}>
      <View style={styles.dayIntro}>
        <View>
          <Text style={styles.dayTitle}>{day.day}</Text>
          <Text style={styles.dayFocus}>{day.focus}</Text>
        </View>
        <Tag label={`${day.meals.length} MEALS`} icon="restaurant-menu" />
      </View>
      <View style={styles.dayMeals}>
        {day.meals.map((meal, index) => <PlanMealCard key={`${day.day}-${meal.slot}-${index}`} meal={meal} index={index} />)}
      </View>
    </View>
  );
}

export default function PlanScreen() {
  const [state, setState] = useState<DietState>(blankState);
  const [form, setForm] = useState<DietPreferences>(DEFAULT_PREFERENCES);
  const [selectedDay, setSelectedDay] = useState(0);
  const [error, setError] = useState("");
  const generatePlan = trpc.diet.generatePlan.useMutation();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadDietState().then((next) => {
        if (active) {
          setState(next);
          setForm(next.preferences);
          setSelectedDay(0);
        }
      });
      return () => { active = false; };
    }, []),
  );

  const update = <K extends keyof DietPreferences>(key: K, value: DietPreferences[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleGenerate = async () => {
    setError("");
    try {
      await savePreferences(form);
      const created = await generatePlan.mutateAsync(form);
      const next = await saveWeeklyPlan(created);
      setState(next);
      setSelectedDay(0);
    } catch {
      setError("Nutrolo couldn’t make that plan just now. Your previous plan is safe — check your connection and try again.");
    }
  };

  const plan = state.weeklyPlan;
  const activeDay = plan?.days[selectedDay];

  return (
    <ScreenFrame>
      <PageScroll contentStyle={styles.pageContent}>
        <PageHeading eyebrow="NUTROLO AI · YOUR FOOD, YOUR WAY" title="A week that fits." subtitle="A flexible meal plan shaped around what you enjoy, not a set of rules." />

        <SurfaceCard style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeadingIcon}><MaterialIcons name="tune" size={20} color={C.green} /></View>
            <View style={styles.cardHeadingText}>
              <Text style={styles.cardTitle}>Make it yours</Text>
              <Text style={styles.cardSub}>A few details help Nutrolo find your rhythm.</Text>
            </View>
          </View>

          <ChoiceGroup
            label="What are you looking for?"
            values={DIET_GOALS.map((item) => item.value)}
            selected={form.goal}
            onChange={(value) => update("goal", value)}
            display={(value) => DIET_GOALS.find((item) => item.value === value)?.label ?? value}
          />
          <ChoiceGroup
            label="How do you like to eat?"
            values={DIET_STYLES.map((item) => item.value)}
            selected={form.dietStyle}
            onChange={(value) => update("dietStyle", value)}
            display={(value) => DIET_STYLES.find((item) => item.value === value)?.label ?? value}
          />
          <Field
            label="Allergies or ingredients to avoid"
            value={form.allergies}
            onChangeText={(value) => update("allergies", value)}
            placeholder="For example: peanuts, shellfish"
            maxLength={200}
            returnKeyType="next"
          />
          <Field
            label="Foods you would rather skip"
            value={form.dislikes}
            onChangeText={(value) => update("dislikes", value)}
            placeholder="For example: mushrooms, olives"
            maxLength={200}
            returnKeyType="next"
          />
          <Field
            label="Cuisine you enjoy (optional)"
            value={form.cuisine}
            onChangeText={(value) => update("cuisine", value)}
            placeholder="For example: Indian, Mexican, Japanese"
            maxLength={80}
            returnKeyType="done"
          />
          <ChoiceGroup
            label="Meals each day"
            values={MEAL_COUNTS}
            selected={form.mealsPerDay}
            onChange={(value) => update("mealsPerDay", value)}
          />

          <View style={styles.privacyNote}>
            <MaterialIcons name="lock-outline" size={16} color={C.green} />
            <Text style={styles.privacyText}>Preferences are sent securely to Nutrolo AI to create your plan. Please don’t enter medical details.</Text>
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
          <PrimaryButton
            label={plan ? "Create a fresh week" : "Build my 7-day plan"}
            icon="auto-awesome"
            loading={generatePlan.isPending}
            onPress={() => { void handleGenerate(); }}
          />
          <Text style={styles.disclaimer}>General wellness ideas only — not medical advice. Nutrition numbers are estimates; double-check ingredients and food labels, especially for allergies.</Text>
        </SurfaceCard>

        {plan ? (
          <View style={styles.resultSection}>
            <View style={styles.resultTitleRow}>
              <View style={styles.resultTitleText}>
                <Text style={styles.resultEyebrow}>YOUR NUTROLO WEEK</Text>
                <Text style={styles.resultTitle}>{plan.title}</Text>
              </View>
              <Tag label="AI MADE" icon="auto-awesome" tone="coral" />
            </View>
            <Text style={styles.resultOverview}>{plan.overview}</Text>
            <View style={styles.daySelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorInner}>
                {plan.days.map((day, index) => (
                  <ChoiceChip key={`${day.day}-${index}`} label={day.day.slice(0, 3)} selected={selectedDay === index} onPress={() => setSelectedDay(index)} />
                ))}
              </ScrollView>
            </View>
            {activeDay ? <DayPlan day={activeDay} /> : null}
            {plan.groceryList.length ? (
              <SurfaceCard style={styles.groceryCard}>
                <View style={styles.groceryHeader}>
                  <View style={styles.groceryIcon}><MaterialIcons name="shopping-basket" size={19} color={C.green} /></View>
                  <View>
                    <Text style={styles.cardTitle}>A few things to have on hand</Text>
                    <Text style={styles.cardSub}>A simple start for the week</Text>
                  </View>
                </View>
                <View style={styles.groceryChips}>
                  {plan.groceryList.map((item, index) => <View key={`${item}-${index}`} style={styles.groceryChip}><Text style={styles.groceryText}>{item}</Text></View>)}
                </View>
              </SurfaceCard>
            ) : null}
          </View>
        ) : (
          <SurfaceCard style={styles.previewCard}>
            <View style={styles.previewArt}><MaterialIcons name="auto-awesome" size={25} color={C.green} /></View>
            <Text style={styles.previewTitle}>Your week, with a little more ease.</Text>
            <Text style={styles.previewCopy}>Once you create your plan, you’ll find simple meal ideas and nutrition estimates here — ready to adapt to your day.</Text>
          </SurfaceCard>
        )}
      </PageScroll>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  pageContent: { gap: 18 },
  formCard: { gap: 17 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  cardHeadingIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: C.greenPale, alignItems: "center", justifyContent: "center" },
  cardHeadingText: { flex: 1, gap: 3 },
  cardTitle: { color: C.ink, fontSize: 15, fontWeight: "900" },
  cardSub: { color: C.muted, fontSize: 11, lineHeight: 15 },
  choiceGroup: { gap: 9 },
  formLabel: { color: C.ink, fontSize: 12, fontWeight: "800" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  privacyNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 14, backgroundColor: C.greenPale },
  privacyText: { flex: 1, color: C.greenDark, fontSize: 10, lineHeight: 15 },
  errorText: { color: C.danger, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  disclaimer: { color: C.muted, fontSize: 10, lineHeight: 15, textAlign: "center" },
  previewCard: { alignItems: "flex-start", gap: 9, backgroundColor: "#F1F5E9" },
  previewArt: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.lime, alignItems: "center", justifyContent: "center", marginBottom: 3 },
  previewTitle: { color: C.ink, fontSize: 17, lineHeight: 23, fontWeight: "900", maxWidth: 300 },
  previewCopy: { color: C.muted, fontSize: 12, lineHeight: 18 },
  resultSection: { gap: 13 },
  resultTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  resultTitleText: { flex: 1, gap: 3 },
  resultEyebrow: { color: C.green, fontSize: 9, letterSpacing: 1.2, fontWeight: "900" },
  resultTitle: { color: C.ink, fontSize: 20, lineHeight: 26, fontWeight: "900" },
  resultOverview: { color: C.muted, fontSize: 12, lineHeight: 18 },
  daySelector: { marginHorizontal: -20 },
  daySelectorInner: { paddingHorizontal: 20, gap: 7 },
  dayWrap: { gap: 12 },
  dayIntro: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  dayTitle: { color: C.ink, fontSize: 18, fontWeight: "900" },
  dayFocus: { color: C.muted, fontSize: 11, marginTop: 3 },
  dayMeals: { gap: 9 },
  planMealCard: { padding: 14, gap: 10 },
  planMealTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  planMealIcon: { width: 38, height: 38, backgroundColor: C.greenPale, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  planMealNameWrap: { flex: 1, gap: 2 },
  planMealSlot: { color: C.muted, fontSize: 9, textTransform: "uppercase", fontWeight: "900", letterSpacing: 0.8 },
  planMealName: { color: C.ink, fontSize: 13, lineHeight: 18, fontWeight: "900" },
  planKcal: { color: C.green, fontSize: 14, fontWeight: "900" },
  planKcalUnit: { color: C.muted, fontSize: 9, fontWeight: "700" },
  planDescription: { color: C.muted, fontSize: 11, lineHeight: 16 },
  ingredients: { color: C.greenDark, fontSize: 10, lineHeight: 15 },
  planMacros: { flexDirection: "row", gap: 13, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 9 },
  planMacro: { color: C.muted, fontSize: 9 },
  bold: { color: C.ink, fontWeight: "900" },
  groceryCard: { gap: 13 },
  groceryHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  groceryIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: C.lime, alignItems: "center", justifyContent: "center" },
  groceryChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  groceryChip: { backgroundColor: C.background, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  groceryText: { color: C.ink, fontSize: 10, fontWeight: "700" },
});
