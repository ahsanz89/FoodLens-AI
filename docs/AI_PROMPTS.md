# AI prompts and contracts

**Ingredient detection** (live in `supabase/functions/scan-ingredients/index.ts`, Gemini with a JSON response schema):
rules = only visible ingredients, no invented ones, mark uncertain items `needs_confirmation`, null quantities unless estimable, JSON only, no recipes, empty list + `no_food` when no food.

Response: `{ ingredients: [{ name, category, estimated_quantity, unit, confidence, needs_confirmation }], image_quality, warnings, overall_status }`.

Client policy: anything with `needs_confirmation` or confidence < 0.65 must be confirmed or removed before "Find Recipes" enables. Predictions are never treated as facts.

**Recipe generation**: not wired to an LLM yet. Recipes are matched locally, so match % is computed, never AI-claimed. The PRD's generation prompt and schema are the intended contract for a future `generate-recipes` function; `Recipe` in `src/types` is the target shape, and `sourceType: 'ai'` already renders an AI disclaimer.

**Substitutions**: offline rule table (`src/services/ai/substitutions.ts`) that never suggests an allergen the user listed. An LLM version should keep that filter on the server.

Swapping providers: implement `IngredientRecognitionService` and register it in `src/services/ai/index.ts`.
