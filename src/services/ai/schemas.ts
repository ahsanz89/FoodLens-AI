import { z } from 'zod';

export const DetectionSchema = z.object({
  ingredients: z.array(z.object({
    name: z.string().min(1).max(80),
    category: z.string().default('Other'),
    estimated_quantity: z.number().nullable().default(null),
    unit: z.string().nullable().default(null),
    confidence: z.number().min(0).max(1),
    needs_confirmation: z.boolean().default(false),
  })).max(60),
  image_quality: z.enum(['good', 'poor', 'unusable']).default('good'),
  warnings: z.array(z.string()).default([]),
  overall_status: z.enum(['success', 'partial', 'no_food', 'error']).default('success'),
});
export type Detection = z.infer<typeof DetectionSchema>;

export const SubstitutionSchema = z.object({
  original: z.string(),
  substitute: z.string(),
  quantity_conversion: z.string(),
  explanation: z.string(),
  allergen_warning: z.string().nullable().default(null),
});
export type Substitution = z.infer<typeof SubstitutionSchema>;
