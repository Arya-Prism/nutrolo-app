# Nutrolo — Mobile App Outcomes

## [x] 1. AI-powered diet planning
- Replace the Expo starter welcome screen with a branded Nutrolo diet-planning experience; the app is a diet-plan app, not a NativeWind demo.
- Let the user enter a health goal, eating style, allergies, disliked foods, cuisine preference and meals per day without requiring an account.
- Generate a structured seven-day meal plan with meal names, ingredients, simple preparation notes and estimated calories, protein, carbohydrates and fat.
- Make the AI request server-side through the project’s supplied Manus LLM helper; never expose platform credentials in browser or native bundles.
- Show clear loading, success and retryable error states; validate AI output before rendering and keep the previous plan if a generation fails.
- Persist the user’s preferences and generated plan on the device so they can return to them after leaving the app.
- State that the plan is general wellness information, estimates are approximate, and food labels/allergens should be checked; do not present it as diagnosis or medical care.

## [x] 2. Meal logging, photos and nutrition history
- Let the user navigate by date and add meal entries with a meal name and calories, protein, carbohydrates and fat; allow an optional photo.
- Validate non-negative nutrition values and persist entries locally on the device.
- Show selected-day totals and macro progress, list the meals for that date, and allow entries to be edited or deleted.
- Provide a history view with nutrition totals over time so the source app’s diet calendar/chart purpose is retained.

## [x] 3. Mobile Preview and Android build readiness
- Keep the implementation in the initialized Expo/React Native Mobile project and preserve its fixed Metro/Web port 8081 and API port 3000.
- Make the primary diet-planning and tracking screens render in the running Webdev Mobile Preview and support the same core flows in native Android.
- Keep local user data local, handle AI/network failures visibly, and keep server credentials out of the app bundle.
- An APK/AAB release is a separate Dashboard build; do not claim an artifact until that build returns successfully.

## [x] 4. AI food-photo identification and detailed nutrition
- When the user selects a food photo and explicitly taps Analyze, use a server-side vision model to identify likely foods/components and estimate the serving shown.
- Return editable estimates for calories, protein, carbohydrates and fat, plus fiber, sugars and sodium; provide detailed approximate calcium, iron, magnesium, zinc, potassium and vitamins A, B12, C, D, E, K and folate with units.
- Show the detected food, portion assumptions and confidence/uncertainty; if the photo is not food or cannot be identified, explain that and allow manual entry or a clearer-photo retry instead of inventing a meal.
- Show the detailed nutrient breakdown before saving and on saved meal details; persist it locally with the meal and let the user review or adjust the headline meal name and macros before saving.
- Keep photos on-device unless the user taps Analyze; explain that the selected photo is then sent to Nutrolo’s server-side AI for this request, and do not present visual estimates as laboratory results or medical advice.
