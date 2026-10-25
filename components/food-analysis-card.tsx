import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

import { C } from "@/components/diet-ui";
import { type FoodAnalysis } from "@/lib/diet-types";

type MacroValues = Pick<FoodAnalysis, "calories" | "protein" | "carbohydrates" | "fat">;

type Props = {
  mealName: string;
  analysis: FoodAnalysis;
  macros: MacroValues;
};

const MICRONUTRIENTS: { key: keyof FoodAnalysis["micronutrients"]; label: string; unit: string }[] = [
  { key: "calciumMg", label: "Calcium", unit: "mg" },
  { key: "ironMg", label: "Iron", unit: "mg" },
  { key: "magnesiumMg", label: "Magnesium", unit: "mg" },
  { key: "zincMg", label: "Zinc", unit: "mg" },
  { key: "potassiumMg", label: "Potassium", unit: "mg" },
  { key: "vitaminAMcgRAE", label: "Vitamin A", unit: "mcg RAE" },
  { key: "vitaminCMg", label: "Vitamin C", unit: "mg" },
  { key: "vitaminDMcg", label: "Vitamin D", unit: "mcg" },
  { key: "vitaminEMg", label: "Vitamin E", unit: "mg" },
  { key: "vitaminKMcg", label: "Vitamin K", unit: "mcg" },
  { key: "vitaminB12Mcg", label: "Vitamin B12", unit: "mcg" },
  { key: "folateMcgDFE", label: "Folate", unit: "mcg DFE" },
];

function displayAmount(value: number, unit: string) {
  const rounded = value > 0 && value < 10 ? value.toFixed(1) : Math.round(value).toLocaleString();
  return `${rounded} ${unit}`;
}

export function FoodAnalysisCard({ mealName, analysis, macros }: Props) {
  const headline = [
    { label: "Energy", value: `${Math.round(macros.calories).toLocaleString()} kcal` },
    { label: "Protein", value: `${Math.round(macros.protein)} g` },
    { label: "Carbs", value: `${Math.round(macros.carbohydrates)} g` },
    { label: "Fat", value: `${Math.round(macros.fat)} g` },
    { label: "Fiber", value: `${Math.round(analysis.fiber)} g` },
    { label: "Sugars", value: `${Math.round(analysis.sugars)} g` },
    { label: "Sodium", value: `${Math.round(analysis.sodiumMg).toLocaleString()} mg` },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>AI FOOD SCAN</Text>
          <Text style={styles.title}>{mealName || analysis.foodName}</Text>
        </View>
        <View style={styles.confidence}>
          <MaterialIcons name="auto-awesome" size={13} color={C.green} />
          <Text style={styles.confidenceText}>{analysis.confidence} match</Text>
        </View>
      </View>

      <Text style={styles.detected}>Nutrolo identified: {analysis.foodName}</Text>
      <Text style={styles.description}>{analysis.description}</Text>
      {analysis.components.length ? (
        <Text style={styles.components}>Visible foods: {analysis.components.join(" · ")}</Text>
      ) : null}
      <View style={styles.portionRow}>
        <Text style={styles.portionLabel}>Serving estimate</Text>
        <Text style={styles.portionValue}>{analysis.portion}</Text>
      </View>

      <Text style={styles.sectionLabel}>ESTIMATED NUTRITION</Text>
      <View style={styles.macroGrid}>
        {headline.map((item) => (
          <View key={item.label} style={styles.metric}>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <Text style={styles.metricValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>VITAMINS & MINERALS · APPROXIMATE</Text>
      <View style={styles.microGrid}>
        {MICRONUTRIENTS.map((item) => (
          <View key={item.key} style={styles.microRow}>
            <Text style={styles.microLabel}>{item.label}</Text>
            <Text style={styles.microValue}>{displayAmount(analysis.micronutrients[item.key], item.unit)}</Text>
          </View>
        ))}
      </View>

      {analysis.assumptions ? (
        <View style={styles.assumptionBox}>
          <Text style={styles.assumptionLabel}>PORTION & RECIPE NOTES</Text>
          <Text style={styles.assumptionText}>{analysis.assumptions}</Text>
        </View>
      ) : null}
      <Text style={styles.disclaimer}>
        Photo estimates can’t confirm exact ingredients, oil or serving weight. Micronutrients are especially approximate — these are not lab results or medical advice.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#F9FBF7", borderColor: C.line, borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  heading: { flex: 1, gap: 3 },
  eyebrow: { color: C.green, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: C.ink, fontSize: 15, lineHeight: 19, fontWeight: "900" },
  confidence: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, backgroundColor: C.greenPale, paddingHorizontal: 8, paddingVertical: 6 },
  confidenceText: { color: C.green, fontSize: 8, fontWeight: "900", textTransform: "capitalize" },
  detected: { color: C.greenDark, fontSize: 10, lineHeight: 15, fontWeight: "800" },
  description: { color: C.muted, fontSize: 10, lineHeight: 15 },
  components: { color: C.ink, fontSize: 9, lineHeight: 14, fontWeight: "700" },
  portionRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: C.surface },
  portionLabel: { color: C.muted, fontSize: 9, fontWeight: "700" },
  portionValue: { flex: 1, textAlign: "right", color: C.ink, fontSize: 9, fontWeight: "800" },
  sectionLabel: { color: C.green, fontSize: 8, fontWeight: "900", letterSpacing: 0.8, marginTop: 2 },
  macroGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metric: { width: "31%", minHeight: 48, flexGrow: 1, justifyContent: "center", gap: 3, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 11, paddingHorizontal: 8, paddingVertical: 7 },
  metricLabel: { color: C.muted, fontSize: 8, fontWeight: "700" },
  metricValue: { color: C.ink, fontSize: 10, fontWeight: "900" },
  microGrid: { flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 7 },
  microRow: { width: "47%", flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 4, borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 5 },
  microLabel: { flexShrink: 1, color: C.muted, fontSize: 9, fontWeight: "700" },
  microValue: { color: C.ink, fontSize: 9, fontWeight: "900", textAlign: "right" },
  assumptionBox: { gap: 3, borderLeftWidth: 2, borderLeftColor: C.gold, paddingLeft: 9 },
  assumptionLabel: { color: C.muted, fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  assumptionText: { color: C.ink, fontSize: 9, lineHeight: 14 },
  disclaimer: { color: C.muted, fontSize: 8, lineHeight: 12 },
});
