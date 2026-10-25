import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { C, IconButton, PageHeading, PageScroll, PrimaryButton, ScreenFrame, SectionHeading, SurfaceCard } from "@/components/diet-ui";
import { FoodAnalysisCard } from "@/components/food-analysis-card";
import { addDays, deleteMeal, formatLongDate, loadDietState, localDateKey, saveMeal, sumMeals } from "@/lib/diet-store";
import { type DietState, type FoodAnalysis, type LoggedMeal } from "@/lib/diet-types";
import { trpc } from "@/lib/trpc";

const emptyState: DietState = {
  preferences: { goal: "feel-better", dietStyle: "balanced", allergies: "", dislikes: "", cuisine: "", mealsPerDay: 3 },
  weeklyPlan: null,
  meals: [],
};

type MealDraft = {
  name: string;
  calories: string;
  protein: string;
  carbohydrates: string;
  fat: string;
  photoDataUri: string;
  analysis: FoodAnalysis | null;
};
type MealDraftTextKey = Exclude<keyof MealDraft, "analysis">;

const blankDraft: MealDraft = { name: "", calories: "", protein: "", carbohydrates: "", fat: "", photoDataUri: "", analysis: null };

function draftNumber(value: string, fallback: number) {
  if (!value.trim()) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function TotalsCard({ meals }: { meals: LoggedMeal[] }) {
  const totals = sumMeals(meals);
  const macroEnergy = [
    { label: "Protein", grams: totals.protein, calories: totals.protein * 4, color: C.lime },
    { label: "Carbs", grams: totals.carbohydrates, calories: totals.carbohydrates * 4, color: "#F4B08C" },
    { label: "Fat", grams: totals.fat, calories: totals.fat * 9, color: "#F3D67B" },
  ];
  const totalMacroEnergy = macroEnergy.reduce((sum, item) => sum + item.calories, 0);
  return (
    <SurfaceCard style={styles.totalsCard}>
      <View style={styles.totalsTop}>
        <View>
          <Text style={styles.kicker}>YOUR DAY, IN NUMBERS</Text>
          <Text style={styles.calorieNumber}>{Math.round(totals.calories).toLocaleString()} <Text style={styles.kcal}>kcal</Text></Text>
        </View>
        <View style={styles.totalsIcon}><MaterialIcons name="insights" size={20} color={C.green} /></View>
      </View>
      <View style={styles.totalMacros}>
        <MacroValue label="Protein" value={totals.protein} />
        <MacroValue label="Carbs" value={totals.carbohydrates} />
        <MacroValue label="Fat" value={totals.fat} />
      </View>
      <View style={styles.macroMix}>
        <Text style={styles.macroMixLabel}>MACRO MIX · SHARE OF LOGGED MACRO ENERGY</Text>
        {macroEnergy.map((item) => {
          const share = totalMacroEnergy > 0 ? Math.round(item.calories / totalMacroEnergy * 100) : 0;
          return (
            <View key={item.label} style={styles.macroMixRow}>
              <View style={styles.macroMixHeading}>
                <Text style={styles.macroMixName}>{item.label} · {Math.round(item.grams)} g</Text>
                <Text style={styles.macroMixPercent}>{share}%</Text>
              </View>
              <View style={styles.macroMixTrack}>
                <View style={[styles.macroMixFill, { width: `${share}%`, backgroundColor: item.color }]} />
              </View>
            </View>
          );
        })}
      </View>
      <Text style={styles.estimate}>Estimates from your logged meals — not a daily target.</Text>
    </SurfaceCard>
  );
}

function MacroValue({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.macroValueWrap}>
      <Text style={styles.macroValueLabel}>{label}</Text>
      <Text style={styles.macroValue}>{Math.round(value)}<Text style={styles.gram}> g</Text></Text>
    </View>
  );
}

function WeekStrip({ selected, onSelect }: { selected: Date; onSelect: (date: Date) => void }) {
  const weekStart = addDays(selected, -((selected.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  return (
    <View style={styles.weekStrip}>
      {days.map((date) => {
        const active = localDateKey(date) === localDateKey(selected);
        return (
          <Pressable key={localDateKey(date)} onPress={() => onSelect(date)} style={[styles.dayButton, active && styles.dayButtonActive]}>
            <Text style={[styles.dayLetter, active && styles.dayLetterActive]}>{new Intl.DateTimeFormat("en", { weekday: "narrow" }).format(date)}</Text>
            <Text style={[styles.dayNumber, active && styles.dayNumberActive]}>{date.getDate()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function WeeklyCalories({ meals, anchor }: { meals: LoggedMeal[]; anchor: Date }) {
  const dates = Array.from({ length: 7 }, (_, index) => addDays(anchor, index - 6));
  const values = dates.map((date) => sumMeals(meals.filter((meal) => meal.date === localDateKey(date))).calories);
  const max = Math.max(700, ...values);
  return (
    <SurfaceCard style={styles.chartCard}>
      <Text style={styles.chartCaption}>A small look back · calories logged</Text>
      <View style={styles.chartRow}>
        {dates.map((date, index) => (
          <View key={localDateKey(date)} style={styles.chartColumn}>
            <View style={styles.chartRail}>
              <View style={[styles.chartBar, { height: values[index] ? Math.max(7, values[index] / max * 62) : 5 }]} />
            </View>
            <Text style={styles.chartLabel}>{new Intl.DateTimeFormat("en", { weekday: "narrow" }).format(date)}</Text>
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}

function MealRow({ meal, onEdit, onDelete, onDetails }: { meal: LoggedMeal; onEdit: () => void; onDelete: () => void; onDetails: () => void }) {
  return (
    <View style={styles.mealRow}>
      {meal.photoDataUri ? (
        <Image source={{ uri: meal.photoDataUri }} style={styles.mealPhoto} />
      ) : (
        <View style={styles.mealPlaceholder}><MaterialIcons name="restaurant" size={19} color={C.green} /></View>
      )}
      <Pressable onPress={onEdit} style={styles.mealInfo}>
        <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
        <Text style={styles.mealMacros}>{meal.protein}g protein · {meal.carbohydrates}g carbs · {meal.fat}g fat</Text>
      </Pressable>
      <View style={styles.mealActions}>
        <Text style={styles.mealCalories}>{meal.calories}<Text style={styles.kcalSmall}> kcal</Text></Text>
        <View style={styles.mealActionsRow}>
          {meal.analysis ? (
            <Pressable onPress={onDetails} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Show nutrient details for ${meal.name}`} style={styles.mealActionButton}>
              <MaterialIcons name="info-outline" size={16} color={C.green} />
            </Pressable>
          ) : null}
          <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Delete ${meal.name}`} style={styles.deleteButton}>
            <MaterialIcons name="close" size={17} color={C.muted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function JournalScreen() {
  const [state, setState] = useState<DietState>(emptyState);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MealDraft>(blankDraft);
  const [formError, setFormError] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
  const analyzeFood = trpc.diet.analyzeFood.useMutation();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadDietState().then((next) => { if (active) setState(next); });
      return () => { active = false; };
    }, []),
  );

  const selectedKey = localDateKey(selectedDate);
  const dayMeals = useMemo(() => state.meals.filter((meal) => meal.date === selectedKey).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [state.meals, selectedKey]);

  const startNewMeal = () => {
    setEditingId(null);
    setDraft(blankDraft);
    setFormError("");
    setModalVisible(true);
  };

  const editMeal = (meal: LoggedMeal) => {
    setEditingId(meal.id);
    setDraft({
      name: meal.name,
      calories: String(meal.calories),
      protein: String(meal.protein),
      carbohydrates: String(meal.carbohydrates),
      fat: String(meal.fat),
      photoDataUri: meal.photoDataUri ?? "",
      analysis: meal.analysis ?? null,
    });
    setFormError("");
    setModalVisible(true);
  };

  const pickPhoto = async (source: "camera" | "library") => {
    setPhotoLoading(true);
    setFormError("");
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setFormError("Allow camera access to take a meal photo, or choose a photo from your library instead.");
          return;
        }
      }
      const pickerOptions: Parameters<typeof ImagePicker.launchCameraAsync>[0] = {
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.65,
        base64: true,
      };
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const converted = await ImageManipulator.manipulateAsync(
          asset.uri,
          asset.width > 1200 ? [{ resize: { width: 1200 } }] : [],
          { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG, base64: true },
        );
        const photoDataUri = converted.base64 ? `data:image/jpeg;base64,${converted.base64}` : "";
        if (!photoDataUri) {
          setFormError("Nutrolo couldn’t prepare that image. Try another photo or enter the meal manually.");
          return;
        }
        if (photoDataUri.length > 900_000) {
          setFormError("That photo is still too large after compression. Try a smaller image.");
        } else {
          setDraft((current) => ({ ...current, photoDataUri, analysis: null }));
        }
      }
    } catch {
      setFormError("Couldn’t prepare that photo. You can choose another image or log the meal manually.");
    } finally {
      setPhotoLoading(false);
    }
  };

  const analyzePhoto = async () => {
    if (!/^data:image\/(?:jpeg|png|webp);base64,/i.test(draft.photoDataUri)) {
      setFormError("Choose a food photo first so Nutrolo can analyze it.");
      return;
    }
    setFormError("");
    try {
      const analysis = await analyzeFood.mutateAsync({ photoDataUri: draft.photoDataUri });
      setDraft((current) => ({
        ...current,
        name: current.name.trim() ? current.name : analysis.foodName,
        calories: String(Math.round(analysis.calories)),
        protein: String(Math.round(analysis.protein)),
        carbohydrates: String(Math.round(analysis.carbohydrates)),
        fat: String(Math.round(analysis.fat)),
        analysis,
      }));
    } catch (error) {
      setFormError(error instanceof Error
        ? error.message
        : "Nutrolo couldn’t analyze this photo right now. You can try again or enter the nutrition manually.");
    }
  };

  const saveDraft = async () => {
    const numeric = [draft.calories, draft.protein, draft.carbohydrates, draft.fat].map((value) => Number(value));
    if (!draft.name.trim()) {
      setFormError("Add a meal name first.");
      return;
    }
    if (numeric.some((value) => !Number.isFinite(value) || value < 0 || value > 10000)) {
      setFormError("Enter nutrition values as non-negative numbers.");
      return;
    }
    setSaving(true);
    setFormError("");
    const meal: LoggedMeal = {
      id: editingId ?? `meal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: selectedKey,
      name: draft.name.trim(),
      calories: Math.round(numeric[0]),
      protein: Math.round(numeric[1]),
      carbohydrates: Math.round(numeric[2]),
      fat: Math.round(numeric[3]),
      photoDataUri: draft.photoDataUri || undefined,
      analysis: draft.analysis ?? undefined,
      createdAt: new Date().toISOString(),
    };
    try {
      const next = await saveMeal(meal);
      setState(next);
      setModalVisible(false);
      setDraft(blankDraft);
    } catch {
      setFormError("Your meal couldn’t be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const removeMeal = (meal: LoggedMeal) => {
    const remove = async () => {
      const next = await deleteMeal(meal.id);
      setState(next);
    };
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(`Remove “${meal.name}” from your food log?`)) void remove();
      return;
    }
    Alert.alert("Remove meal?", `Remove “${meal.name}” from your food log?`, [
      { text: "Keep it", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => { void remove(); } },
    ]);
  };

  const setField = (key: MealDraftTextKey, value: string) => setDraft((current) => ({
    ...current,
    [key]: value,
    ...(key === "photoDataUri" && !value ? { analysis: null } : {}),
  }));

  return (
    <ScreenFrame>
      <PageScroll contentStyle={styles.pageContent}>
        <PageHeading eyebrow="YOUR PERSONAL FOOD JOURNAL" title="Food, remembered." subtitle="A simple place to notice what nourishes you — without the pressure." />

        <View style={styles.dateNavigation}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous day" onPress={() => setSelectedDate((date) => addDays(date, -1))} style={styles.dateArrow}>
            <MaterialIcons name="chevron-left" size={22} color={C.green} />
          </Pressable>
          <View style={styles.selectedDateText}>
            <Text style={styles.selectedDate}>{formatLongDate(selectedDate)}</Text>
            <Text style={styles.selectedDateCaption}>{selectedKey === localDateKey(new Date()) ? "TODAY" : "DAILY LOG"}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Next day" onPress={() => setSelectedDate((date) => addDays(date, 1))} style={styles.dateArrow}>
            <MaterialIcons name="chevron-right" size={22} color={C.green} />
          </Pressable>
        </View>

        <WeekStrip selected={selectedDate} onSelect={setSelectedDate} />
        <TotalsCard meals={dayMeals} />

        <View>
          <SectionHeading title="Meals on this day" action="Add meal" onAction={startNewMeal} />
          {dayMeals.length ? (
            <SurfaceCard style={styles.mealListCard}>
              {dayMeals.map((meal, index) => (
                <View key={meal.id} style={index ? styles.mealDivider : undefined}>
                  <MealRow
                    meal={meal}
                    onEdit={() => editMeal(meal)}
                    onDelete={() => removeMeal(meal)}
                    onDetails={() => setExpandedDetailsId((current) => current === meal.id ? null : meal.id)}
                  />
                  {expandedDetailsId === meal.id && meal.analysis ? (
                    <FoodAnalysisCard
                      mealName={meal.name}
                      analysis={meal.analysis}
                      macros={{ calories: meal.calories, protein: meal.protein, carbohydrates: meal.carbohydrates, fat: meal.fat }}
                    />
                  ) : null}
                </View>
              ))}
            </SurfaceCard>
          ) : (
            <SurfaceCard style={styles.emptyMeals}>
              <View style={styles.emptyIcon}><MaterialIcons name="lunch-dining" size={20} color={C.green} /></View>
              <Text style={styles.emptyTitle}>A fresh page</Text>
              <Text style={styles.emptyCopy}>When you’re ready, add a meal and its estimated nutrition.</Text>
              <PrimaryButton label="Log a meal" icon="add" onPress={startNewMeal} />
            </SurfaceCard>
          )}
        </View>

        <View>
          <SectionHeading title="Your rhythm" />
          <WeeklyCalories meals={state.meals} anchor={new Date()} />
        </View>

        <View style={styles.localNote}>
          <MaterialIcons name="phone-android" size={15} color={C.muted} />
          <Text style={styles.localNoteText}>Journal and photos stay on-device; a photo is sent to Nutrolo AI only when you tap Analyze.</Text>
        </View>
      </PageScroll>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>{editingId ? "UPDATE YOUR JOURNAL" : "ADD TO YOUR JOURNAL"}</Text>
                <Text style={styles.modalTitle}>{editingId ? "Edit meal" : "A meal worth noting"}</Text>
              </View>
              <IconButton name="close" accessibilityLabel="Close meal form" onPress={() => setModalVisible(false)} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalFields}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Meal name</Text>
                <TextInput value={draft.name} onChangeText={(value) => setField("name", value)} placeholder="e.g. Avocado toast & eggs" placeholderTextColor={C.muted} style={styles.input} maxLength={80} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Estimated nutrition</Text>
                <View style={styles.numberGrid}>
                  <NumericField label="Calories" value={draft.calories} onChange={(value) => setField("calories", value)} suffix="kcal" />
                  <NumericField label="Protein" value={draft.protein} onChange={(value) => setField("protein", value)} suffix="g" />
                  <NumericField label="Carbs" value={draft.carbohydrates} onChange={(value) => setField("carbohydrates", value)} suffix="g" />
                  <NumericField label="Fat" value={draft.fat} onChange={(value) => setField("fat", value)} suffix="g" />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Food photo <Text style={styles.optional}>(optional)</Text></Text>
                {draft.photoDataUri ? (
                  <View style={styles.photoContent}>
                    <View style={styles.photoPreviewWrap}>
                      <Image source={{ uri: draft.photoDataUri }} style={styles.photoPreview} />
                      <Pressable onPress={() => setField("photoDataUri", "")} style={styles.removePhoto} accessibilityRole="button" accessibilityLabel="Remove photo"><MaterialIcons name="close" size={17} color={C.white} /></Pressable>
                    </View>
                    <View style={styles.photoChangeRow}>
                      {Platform.OS !== "web" ? (
                        <Pressable onPress={() => { void pickPhoto("camera"); }} disabled={photoLoading || analyzeFood.isPending}>
                          <Text style={styles.photoTextButton}>Take another</Text>
                        </Pressable>
                      ) : null}
                      <Pressable onPress={() => { void pickPhoto("library"); }} disabled={photoLoading || analyzeFood.isPending}>
                        <Text style={styles.photoTextButton}>Choose another</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.photoOptions}>
                    {Platform.OS !== "web" ? (
                      <Pressable onPress={() => { void pickPhoto("camera"); }} disabled={photoLoading || analyzeFood.isPending} style={styles.photoPicker}>
                        <View style={styles.photoIcon}><MaterialIcons name={photoLoading ? "hourglass-top" : "photo-camera"} size={18} color={C.green} /></View>
                        <View style={styles.photoPickerText}><Text style={styles.photoPickerTitle}>{photoLoading ? "Preparing photo…" : "Take a photo"}</Text><Text style={styles.photoPickerHint}>Use your camera</Text></View>
                        <MaterialIcons name="chevron-right" size={20} color={C.muted} />
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => { void pickPhoto("library"); }} disabled={photoLoading || analyzeFood.isPending} style={styles.photoPicker}>
                      <View style={styles.photoIcon}><MaterialIcons name={photoLoading ? "hourglass-top" : "photo-library"} size={18} color={C.green} /></View>
                      <View style={styles.photoPickerText}><Text style={styles.photoPickerTitle}>{photoLoading ? "Preparing photo…" : "Choose a photo"}</Text><Text style={styles.photoPickerHint}>Select from your library</Text></View>
                      <MaterialIcons name="chevron-right" size={20} color={C.muted} />
                    </Pressable>
                  </View>
                )}
                <Text style={styles.photoPrivacy}>Your photo stays on this device unless you tap Analyze; then it is sent to Nutrolo AI for this estimate.</Text>
                {draft.photoDataUri ? (
                  <PrimaryButton label="Identify food & estimate nutrients" icon="auto-awesome" loading={analyzeFood.isPending} disabled={photoLoading || saving} onPress={() => { void analyzePhoto(); }} />
                ) : null}
                {draft.analysis ? (
                  <FoodAnalysisCard
                    mealName={draft.name || draft.analysis.foodName}
                    analysis={draft.analysis}
                    macros={{
                      calories: draftNumber(draft.calories, draft.analysis.calories),
                      protein: draftNumber(draft.protein, draft.analysis.protein),
                      carbohydrates: draftNumber(draft.carbohydrates, draft.analysis.carbohydrates),
                      fat: draftNumber(draft.fat, draft.analysis.fat),
                    }}
                  />
                ) : null}
              </View>
              {formError ? <Text accessibilityRole="alert" style={styles.errorText}>{formError}</Text> : null}
              <PrimaryButton label={editingId ? "Save changes" : "Save meal"} icon="check" loading={saving} disabled={analyzeFood.isPending} onPress={() => { void saveDraft(); }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenFrame>
  );
}

function NumericField({ label, value, suffix, onChange }: { label: string; value: string; suffix: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.numericField}>
      <Text style={styles.numericLabel}>{label}</Text>
      <View style={styles.numericInputWrap}>
        <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={C.muted} style={styles.numericInput} />
        <Text style={styles.numericSuffix}>{suffix}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContent: { gap: 16 },
  dateNavigation: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: -3 },
  dateArrow: { width: 38, height: 38, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
  selectedDateText: { flex: 1, alignItems: "center", gap: 2 },
  selectedDate: { color: C.ink, fontSize: 15, fontWeight: "900" },
  selectedDateCaption: { color: C.green, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  weekStrip: { flexDirection: "row", gap: 6 },
  dayButton: { flex: 1, minWidth: 35, alignItems: "center", gap: 5, paddingVertical: 9, borderRadius: 15, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  dayButtonActive: { backgroundColor: C.green, borderColor: C.green },
  dayLetter: { color: C.muted, fontSize: 9, fontWeight: "800" },
  dayLetterActive: { color: "#DCEBBF" },
  dayNumber: { color: C.ink, fontSize: 13, fontWeight: "900" },
  dayNumberActive: { color: C.white },
  totalsCard: { backgroundColor: C.green, borderColor: C.green, padding: 17, gap: 15 },
  totalsTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kicker: { color: "#D2E4D5", fontSize: 8, fontWeight: "900", letterSpacing: 1.3 },
  calorieNumber: { color: C.white, fontSize: 29, lineHeight: 36, fontWeight: "900", letterSpacing: -0.5, marginTop: 2 },
  kcal: { color: "#D2E4D5", fontSize: 12, fontWeight: "700", letterSpacing: 0 },
  totalsIcon: { width: 39, height: 39, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  totalMacros: { flexDirection: "row", borderTopColor: "rgba(255,255,255,0.22)", borderTopWidth: 1, paddingTop: 12 },
  macroValueWrap: { flex: 1, gap: 3 },
  macroValueLabel: { color: "#D2E4D5", fontSize: 10, fontWeight: "700" },
  macroValue: { color: C.white, fontSize: 17, fontWeight: "900" },
  gram: { color: "#D2E4D5", fontSize: 10, fontWeight: "700" },
  macroMix: { gap: 7, paddingTop: 1 },
  macroMixLabel: { color: "#D2E4D5", fontSize: 8, fontWeight: "800", letterSpacing: 0.7 },
  macroMixRow: { gap: 4 },
  macroMixHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  macroMixName: { color: "#EAF1E7", fontSize: 9, fontWeight: "700" },
  macroMixPercent: { color: C.white, fontSize: 9, fontWeight: "900" },
  macroMixTrack: { height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.16)", overflow: "hidden" },
  macroMixFill: { height: "100%", borderRadius: 999 },
  estimate: { color: "#D2E4D5", fontSize: 9 },
  mealListCard: { paddingHorizontal: 14, paddingVertical: 2 },
  mealDivider: { borderTopWidth: 1, borderTopColor: C.line },
  mealRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  mealPhoto: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.greenPale },
  mealPlaceholder: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.greenPale, alignItems: "center", justifyContent: "center" },
  mealInfo: { flex: 1, gap: 4 },
  mealName: { color: C.ink, fontSize: 12, fontWeight: "900" },
  mealMacros: { color: C.muted, fontSize: 9 },
  mealActions: { alignItems: "flex-end", gap: 2 },
  mealCalories: { color: C.green, fontSize: 12, fontWeight: "900" },
  kcalSmall: { color: C.muted, fontSize: 8, fontWeight: "700" },
  deleteButton: { padding: 2 },
  mealActionsRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  mealActionButton: { minWidth: 22, minHeight: 22, alignItems: "center", justifyContent: "center" },
  emptyMeals: { gap: 8, alignItems: "flex-start" },
  emptyIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.greenPale, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: C.ink, fontSize: 15, fontWeight: "900" },
  emptyCopy: { color: C.muted, fontSize: 11, lineHeight: 16, marginBottom: 3 },
  chartCard: { gap: 14 },
  chartCaption: { color: C.muted, fontSize: 10 },
  chartRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
  chartColumn: { flex: 1, gap: 6, alignItems: "center" },
  chartRail: { width: "100%", height: 66, borderRadius: 9, backgroundColor: C.background, justifyContent: "flex-end", alignItems: "center", overflow: "hidden" },
  chartBar: { width: "60%", backgroundColor: C.coral, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
  chartLabel: { color: C.muted, fontSize: 9, fontWeight: "800" },
  localNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 2 },
  localNoteText: { color: C.muted, fontSize: 9 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(14,32,22,0.38)", justifyContent: "flex-end" },
  modalSheet: { maxHeight: "92%", backgroundColor: C.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 22 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.line },
  modalKicker: { color: C.green, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  modalTitle: { color: C.ink, fontSize: 20, fontWeight: "900", marginTop: 3 },
  modalFields: { gap: 16, paddingVertical: 16 },
  formGroup: { gap: 8 },
  formLabel: { color: C.ink, fontSize: 11, fontWeight: "900" },
  optional: { color: C.muted, fontSize: 10, fontWeight: "600" },
  input: { minHeight: 46, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, color: C.ink, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  numberGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  numericField: { width: "48%", flexGrow: 1, gap: 5 },
  numericLabel: { color: C.muted, fontSize: 9, fontWeight: "800" },
  numericInputWrap: { minHeight: 44, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: 13, paddingHorizontal: 10 },
  numericInput: { flex: 1, color: C.ink, fontSize: 14, paddingVertical: 9 },
  numericSuffix: { color: C.muted, fontSize: 9, fontWeight: "700" },
  photoPicker: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 15, paddingHorizontal: 11 },
  photoIcon: { width: 36, height: 36, backgroundColor: C.greenPale, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  photoPickerText: { flex: 1, gap: 3 },
  photoPickerTitle: { color: C.ink, fontSize: 11, fontWeight: "800" },
  photoPickerHint: { color: C.muted, fontSize: 9 },
  photoOptions: { gap: 8 },
  photoContent: { alignItems: "flex-start", gap: 6 },
  photoChangeRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, paddingVertical: 3 },
  photoTextButton: { color: C.green, fontSize: 10, fontWeight: "800" },
  photoPrivacy: { color: C.muted, fontSize: 9, lineHeight: 14 },
  photoPreviewWrap: { position: "relative", alignSelf: "flex-start" },
  photoPreview: { width: 118, height: 90, borderRadius: 14, backgroundColor: C.greenPale },
  removePhoto: { position: "absolute", right: 5, top: 5, width: 25, height: 25, borderRadius: 12, backgroundColor: "rgba(25,41,31,0.75)", alignItems: "center", justifyContent: "center" },
  errorText: { color: C.danger, fontSize: 11, lineHeight: 16, fontWeight: "700" },
});
