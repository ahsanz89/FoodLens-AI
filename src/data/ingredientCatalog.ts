import type { IngredientCategory } from '../types';

export const CATALOG: Record<IngredientCategory, string[]> = {
  Vegetable: ['Tomato', 'Onion', 'Garlic', 'Potato', 'Carrot', 'Bell pepper', 'Cucumber', 'Spinach', 'Broccoli', 'Cauliflower', 'Cabbage', 'Mushroom', 'Zucchini', 'Eggplant', 'Green beans', 'Peas', 'Corn', 'Lettuce', 'Spring onion', 'Ginger', 'Green chili', 'Pumpkin', 'Sweet potato', 'Celery', 'Cilantro', 'Parsley', 'Basil', 'Mint'],
  Fruit: ['Lemon', 'Lime', 'Apple', 'Banana', 'Orange', 'Avocado', 'Mango', 'Strawberry', 'Grapes', 'Pineapple', 'Coconut', 'Dates', 'Pomegranate'],
  Dairy: ['Egg', 'Milk', 'Butter', 'Cheese', 'Yogurt', 'Cream', 'Paneer', 'Parmesan', 'Mozzarella', 'Feta'],
  Meat: ['Chicken', 'Beef', 'Lamb', 'Pork', 'Bacon', 'Sausage', 'Turkey', 'Minced meat'],
  Seafood: ['Fish', 'Salmon', 'Tuna', 'Shrimp', 'Crab', 'Squid'],
  Grains: ['Rice', 'Pasta', 'Flour', 'Oats', 'Lentils', 'Chickpeas', 'Beans', 'Quinoa', 'Couscous', 'Noodles', 'Semolina'],
  Spices: ['Salt', 'Black pepper', 'Cumin', 'Turmeric', 'Paprika', 'Chili powder', 'Garam masala', 'Cinnamon', 'Oregano', 'Coriander powder', 'Cardamom', 'Cloves'],
  Condiments: ['Olive oil', 'Oil', 'Soy sauce', 'Vinegar', 'Honey', 'Sugar', 'Tomato paste', 'Mayonnaise', 'Ketchup', 'Tahini', 'Mustard', 'Coconut milk'],
  Bakery: ['Bread', 'Tortilla', 'Baking powder', 'Yeast', 'Pita', 'Naan'],
  Other: ['Tofu', 'Peanuts', 'Almonds', 'Walnuts', 'Chocolate', 'Water'],
};

export const ALL_INGREDIENTS = (Object.entries(CATALOG) as [IngredientCategory, string[]][]).flatMap(([category, names]) => names.map((name) => ({ name, category })));
export const categoryOf = (name: string): IngredientCategory =>
  ALL_INGREDIENTS.find((i) => i.name.toLowerCase() === name.toLowerCase())?.category ?? 'Other';
