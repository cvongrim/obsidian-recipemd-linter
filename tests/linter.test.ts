import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lintRecipe } from '../src/linter';
import { DEFAULT_SETTINGS, RecipeMDLinterSettings } from '../src/types';

const defaultSettings: RecipeMDLinterSettings = {
	...DEFAULT_SETTINGS,
};

describe('RecipeMD Linter - Title Validation', () => {
	it('should pass when a valid # Title is provided', () => {
		const content = `# Perfect Pancakes

---
- *1 cup* flour
- *1 cup* milk
---

1. Mix ingredients.
2. Cook on hot griddle.
`;
		const issues = lintRecipe(content, 'test.md', 'test.md', defaultSettings);
		const titleIssues = issues.filter((i) => i.rule.includes('title'));
		assert.equal(titleIssues.length, 0);
	});

	it('should warn when ## Title is used instead of #', () => {
		const content = `## Pancakes with Level 2 Heading

---
- *1 cup* flour
---

1. Mix and cook.
`;
		const issues = lintRecipe(content, 'test.md', 'test.md', defaultSettings);
		const warning = issues.find((i) => i.rule === 'recipe-title-level');
		assert.ok(warning, 'Expected recipe-title-level warning');
		assert.equal(warning.severity, 'warning');
		assert.match(warning.message, /uses ## instead of a single #/);
	});

	it('should error when no heading is present', () => {
		const content = `Pancakes without Heading

---
- *1 cup* flour
---

1. Mix and cook.
`;
		const issues = lintRecipe(content, 'test.md', 'test.md', defaultSettings);
		const error = issues.find((i) => i.rule === 'missing-title');
		assert.ok(error, 'Expected missing-title error');
		assert.equal(error.severity, 'error');
	});
});

describe('RecipeMD Linter - Ingredients Validation', () => {
	it('should pass standard RecipeMD horizontal rule delimited ingredients', () => {
		const content = `# Beef Stew

---
- *2 lbs* beef chuck
- *4* carrots, chopped
- *3* potatoes, cubed
---

1. Brown the beef.
2. Simmer for 2 hours.
`;
		const issues = lintRecipe(content, 'test.md', 'test.md', defaultSettings);
		const ingIssues = issues.filter((i) => i.rule.includes('ingredient'));
		assert.equal(ingIssues.length, 0);
	});

	it('should support flexible mode with # Ingredients heading', () => {
		const content = `# Banana Bread

## Ingredients
- *3* ripe bananas
- *1/3 cup* melted butter
- *1 cup* sugar

## Directions
1. Mash bananas.
2. Bake at 350F for 55 minutes.
`;
		const issues = lintRecipe(content, 'test.md', 'test.md', {
			...defaultSettings,
			recipeFormatEnforcement: 'flexible',
		});
		const ingIssues = issues.filter((i) => i.rule.includes('ingredient'));
		assert.equal(ingIssues.length, 0);
	});

	it('should error when ingredients section is missing entirely', () => {
		const content = `# Empty Recipe

1. Just do this without any ingredients.
`;
		const issues = lintRecipe(content, 'test.md', 'test.md', defaultSettings);
		const error = issues.find((i) => i.rule === 'missing-ingredients');
		assert.ok(error, 'Expected missing-ingredients error');
		assert.equal(error.severity, 'error');
	});

	it('should error when ingredients section contains no bullet items', () => {
		const content = `# Bread

---
No bullets here, just plain text
---

1. Bake at 400F.
`;
		const issues = lintRecipe(content, 'test.md', 'test.md', defaultSettings);
		const error = issues.find((i) => i.rule === 'missing-ingredients' || i.rule === 'empty-ingredients');
		assert.ok(error, 'Expected missing or empty ingredients error');
	});
});

describe('RecipeMD Linter - Directions Validation', () => {
	it('should pass numbered steps (1. Step, 2. Step)', () => {
		const content = `# Omelet

---
- *2* eggs
- *1 tbsp* butter
---

1. Whisk eggs.
2. Melt butter and pour eggs.
3. Fold and serve.
`;
		const issues = lintRecipe(content, 'test.md', 'test.md', defaultSettings);
		const dirIssues = issues.filter((i) => i.rule.includes('direction'));
		assert.equal(dirIssues.length, 0);
	});

	it('should warn when directions use bullet points instead of numbers', () => {
		const content = `# Omelet

---
- *2* eggs
---

- Whisk eggs in a bowl.
- Pour into hot pan and fold.
`;
		const issues = lintRecipe(content, 'test.md', 'test.md', {
			...defaultSettings,
			warnBulletDirections: true,
		});
		const warning = issues.find((i) => i.rule === 'bullet-directions');
		assert.ok(warning, 'Expected bullet-directions warning');
		assert.equal(warning.severity, 'warning');
	});

	it('should error when directions are missing', () => {
		const content = `# Incomplete Recipe

---
- *1 cup* rice
- *2 cups* water
---
`;
		const issues = lintRecipe(content, 'test.md', 'test.md', defaultSettings);
		const error = issues.find((i) => i.rule === 'missing-directions');
		assert.ok(error, 'Expected missing-directions error');
	});
});

describe('RecipeMD Linter - Frontmatter Compatibility', () => {
	it('should ignore frontmatter and parse the recipe body cleanly', () => {
		const content = `---
source: https://example.com/recipe
tags: [dinner, beef]
---
# Beef Tacos

Delicious weeknight tacos.

*mexican, dinner*

**4 servings**

---
- *1 lb* ground beef
- *1 packet* taco seasoning
- *8* taco shells
---

1. Brown ground beef and drain excess fat.
2. Stir in taco seasoning with water.
3. Spoon into taco shells and top with toppings.
`;
		const issues = lintRecipe(content, 'test.md', 'test.md', defaultSettings);
		assert.equal(issues.length, 0, 'Expected 0 issues for recipe with frontmatter');
	});
});

describe('RecipeMD Linter - Optional Elements', () => {
	it('should enforce yield when enforceYield is enabled', () => {
		const contentWithoutYield = `# Lemonade

---
- *1 cup* lemon juice
---

1. Stir with water and sugar.
`;
		const issues = lintRecipe(contentWithoutYield, 'test.md', 'test.md', {
			...defaultSettings,
			enforceYield: true,
		});
		const yieldIssue = issues.find((i) => i.rule === 'missing-yield');
		assert.ok(yieldIssue, 'Expected missing-yield warning');

		const contentWithYield = `# Lemonade

**4 servings**

---
- *1 cup* lemon juice
---

1. Stir with water and sugar.
`;
		const cleanIssues = lintRecipe(contentWithYield, 'test.md', 'test.md', {
			...defaultSettings,
			enforceYield: true,
		});
		assert.ok(!cleanIssues.some((i) => i.rule === 'missing-yield'));
	});

	it('should enforce tags when enforceTags is enabled', () => {
		const contentWithoutTags = `# Tea

---
- 1 tea bag
- 2 cups water
---

1. Steep in hot water for 5 minutes.
`;
		const issues = lintRecipe(contentWithoutTags, 'test.md', 'test.md', {
			...defaultSettings,
			enforceTags: true,
		});
		const tagIssue = issues.find((i) => i.rule === 'missing-tags');
		assert.ok(tagIssue, 'Expected missing-tags warning');
	});
});

describe('RecipeMD Linter - Real World Fixtures', () => {
	it('should validate Mom\'s Meatloaf with 0 issues', () => {
		const meatloaf = `# Mom's Meatloaf

A very simple, classic comfort food meatloaf recipe made flavorful with onion soup mix.

*beef, easy, comfort food, dinner*

**8 Servings, 2 lb**

---

- *2 lbs* ground beef
- *1 envelope* onion soup mix
- *1 1/2 cups* soft bread crumbs
- *2* eggs
- *3/4 cup* water
- *1/2 cup* ketchup

---

1. Preheat oven to 350°F (175°C).
2. In a large mixing bowl, combine the ground beef, onion soup mix, soft bread crumbs, eggs, water, and ketchup until well combined.
3. Shape into a loaf and place into an ungreased 9x5-inch loaf pan or a shallow baking dish.
4. Bake at 350°F for 1 hour, or until an internal temperature of 160°F is reached.
5. Let rest for 10 minutes before slicing and serving.

### Notes

![[photo.webp]]
`;
		const issues = lintRecipe(meatloaf, 'Mom\'s Meatloaf.md', 'Mom\'s Meatloaf.md', defaultSettings);
		assert.equal(issues.length, 0);
	});
});
