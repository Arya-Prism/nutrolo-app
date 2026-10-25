import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

export const C = {
  background: "#F5F7F1",
  surface: "#FFFFFF",
  ink: "#19291F",
  muted: "#718076",
  line: "#E4EAE0",
  green: "#285B43",
  greenDark: "#1F4735",
  greenPale: "#E8F2E8",
  lime: "#DCEBBF",
  coral: "#E58B63",
  coralPale: "#FFF0E6",
  gold: "#D9A847",
  white: "#FFFFFF",
  danger: "#B94C43",
} as const;

type IconName = ComponentProps<typeof MaterialIcons>["name"];

const GENERATED_BRAND_MARKS = [
  "/manus-storage/async-images/npVP9vpOPq0P5xFWQgFjlf/image-1.webp",
  "/manus-storage/async-images/npVP9vpOPq0P5xFWQgFjlf/image-2.webp",
] as const;

export function ScreenFrame({ children, edges = ["top", "left", "right"] }: { children: ReactNode; edges?: Edge[] }) {
  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      {children}
    </SafeAreaView>
  );
}

export function PageScroll({ children, contentStyle }: { children: ReactNode; contentStyle?: ViewStyle }) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

function BrandMark() {
  const [imageFailed, setImageFailed] = useState(false);
  const source = Platform.OS === "web" && !imageFailed
    ? { uri: GENERATED_BRAND_MARKS[0] }
    : require("../assets/images/android-icon-foreground.png");
  return (
    <Image
      source={source}
      onError={() => setImageFailed(true)}
      resizeMode="contain"
      style={styles.brandSymbol}
      accessibilityLabel="Nutrolo botanical mark"
    />
  );
}

export function BrandHeader({ right }: { right?: ReactNode }) {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandLockup}>
        <View style={styles.brandMark}>
          <BrandMark />
        </View>
        <View>
          <Text style={styles.wordmark}>nutrolo</Text>
          <Text style={styles.brandCaption}>EAT WELL, YOUR WAY</Text>
        </View>
      </View>
      {right}
    </View>
  );
}

export function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.headingWrap}>
      <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SurfaceCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Tag({ label, icon, tone = "green" }: { label: string; icon?: IconName; tone?: "green" | "coral" | "neutral" }) {
  const backgroundColor = tone === "coral" ? C.coralPale : tone === "neutral" ? C.background : C.greenPale;
  const color = tone === "coral" ? C.coral : tone === "neutral" ? C.muted : C.green;
  return (
    <View style={[styles.tag, { backgroundColor }]}>
      {icon ? <MaterialIcons name={icon} size={14} color={color} /> : null}
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  loading = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryButton,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={C.white} size="small" /> : null}
      {!loading && icon ? <MaterialIcons name={icon} size={18} color={C.white} /> : null}
      <Text style={styles.primaryButtonText}>{loading ? "Working on it…" : label}</Text>
      {!loading ? <MaterialIcons name="arrow-forward" size={18} color={C.white} /> : null}
    </Pressable>
  );
}

export function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choiceChip, selected && styles.choiceChipSelected]}
    >
      <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={C.muted}
        selectionColor={C.green}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

export function IconButton({ name, onPress, accessibilityLabel, style }: { name: IconName; onPress: () => void; accessibilityLabel: string; style?: ViewStyle }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed, style]}
    >
      <MaterialIcons name={name} size={20} color={C.green} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 22, maxWidth: 640, width: "100%", alignSelf: "center" },
  brandRow: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandLockup: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 38, height: 38, borderRadius: 14, backgroundColor: C.lime, alignItems: "center", justifyContent: "center" },
  brandSymbol: { width: 27, height: 27 },
  wordmark: { color: C.ink, fontSize: 21, lineHeight: 23, fontWeight: "900", letterSpacing: -0.7 },
  brandCaption: { color: C.muted, fontSize: 8, fontWeight: "800", letterSpacing: 1.1, marginTop: 1 },
  headingWrap: { gap: 6 },
  eyebrow: { color: C.green, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  pageTitle: { color: C.ink, fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.8 },
  pageSubtitle: { color: C.muted, fontSize: 14, lineHeight: 21, maxWidth: 440 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: C.ink, fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },
  sectionAction: { color: C.green, fontSize: 13, fontWeight: "800" },
  card: { backgroundColor: C.surface, borderRadius: 22, padding: 17, borderWidth: 1, borderColor: C.line },
  tag: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  tagText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  primaryButton: { minHeight: 52, paddingHorizontal: 17, borderRadius: 17, backgroundColor: C.green, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  primaryButtonText: { color: C.white, fontSize: 14, fontWeight: "800", flexShrink: 1 },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  choiceChip: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  choiceChipSelected: { borderColor: C.green, backgroundColor: C.green },
  choiceChipText: { color: C.muted, fontSize: 12, fontWeight: "700" },
  choiceChipTextSelected: { color: C.white },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: C.ink, fontSize: 12, fontWeight: "800" },
  input: { minHeight: 48, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, color: C.ink, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14 },
  iconButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
});
