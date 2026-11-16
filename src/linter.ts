import { getFrontMatterInfo } from 'obsidian';
import { LintIssue, RecipeMDLinterSettings } from './types';

export function lintRecipe(
	content: string,
	filePath: string,
	fileName: string,
	settings: RecipeMDLinterSettings
): LintIssue[] {
	const issues: LintIssue[] = [];

	const fmInfo = getFrontMatterInfo(content);
	const hasFrontmatter = fmInfo.exists;
	const body = content.slice(fmInfo.contentStart);

	// Calculate line offset for the body to provide accurate line numbers
	const fmLineCount = hasFrontmatter
		? content.slice(0, fmInfo.contentStart).split('\n').length - 1
		: 0;

	const bodyLines = body.split('\n');

	// 1. Check Title
	if (settings.enforceTitle) {
		let foundH1 = false;
		let firstHeadingLevel = 0;
		let firstHeadingLine = 0;

		for (let i = 0; i < bodyLines.length; i++) {
			const line = bodyLines[i];
			if (line === undefined) continue;

			const match = line.match(/^(#{1,6})\s+(.+)$/);
			if (match && match[1]) {
				firstHeadingLevel = match[1].length;
				firstHeadingLine = fmLineCount + i + 1;
				if (firstHeadingLevel === 1) {
					foundH1 = true;
				}
				break;
			}
		}

		if (!foundH1) {
			if (firstHeadingLevel > 1) {
				issues.push({
					filePath,
					fileName,
					line: firstHeadingLine,
					severity: 'warning',
					rule: 'recipe-title-level',
					message: `Recipe title uses ${'#'.repeat(firstHeadingLevel)} instead of a single #.`,
					suggestion: 'Change the top heading to a single `# Recipe Title` according to RecipeMD standard.',
				});
			} else {
				issues.push({
					filePath,
					fileName,
					line: fmLineCount + 1,
					severity: 'error',
					rule: 'missing-title',
					message: 'Missing recipe title heading (# Recipe Title).',
					suggestion: 'Add `# Recipe Title` at the beginning of the recipe note.',
				});
			}
		}
	}

	// 2. Locate Ingredients Section
	let ingredientsFound = false;
	let ingredientsLine = 0;
	let ingredientItemsCount = 0;
	let hrEndIndex = -1; // index in bodyLines where ingredients end

	// A. Standard RecipeMD: Enclosed between two horizontal rules (---)
	const hrIndices: number[] = [];
	for (let i = 0; i < bodyLines.length; i++) {
		const rawLine = bodyLines[i];
		if (rawLine === undefined) continue;
		const line = rawLine.trim();
		if (/^(---|___|\*\*\*)$/.test(line)) {
			hrIndices.push(i);
		}
	}

	const firstHr = hrIndices[0];
	const secondHr = hrIndices[1];
	if (firstHr !== undefined && secondHr !== undefined) {
		let items = 0;

		for (let i = firstHr + 1; i < secondHr; i++) {
			const rawLine = bodyLines[i];
			if (rawLine === undefined) continue;
			const trimmed = rawLine.trim();
			if (/^[-*]\s+.+/.test(trimmed)) {
				items++;
			}
		}

		if (items > 0) {
			ingredientsFound = true;
			ingredientsLine = fmLineCount + firstHr + 1;
			ingredientItemsCount = items;
			hrEndIndex = secondHr;
		}
	}

	// B. Flexible mode fallback: Check for # Ingredients heading
	if (!ingredientsFound && settings.recipeFormatEnforcement === 'flexible') {
		let inHeadingSection = false;
		for (let i = 0; i < bodyLines.length; i++) {
			const rawLine = bodyLines[i];
			if (rawLine === undefined) continue;

			if (/^#{1,4}\s+Ingredients/i.test(rawLine)) {
				inHeadingSection = true;
				ingredientsLine = fmLineCount + i + 1;
				continue;
			}
			if (inHeadingSection) {
				const trimmed = rawLine.trim();
				if (/^#{1,4}\s+/.test(rawLine) || /^(---|___|\*\*\*)$/.test(trimmed)) {
					hrEndIndex = i;
					break;
				}
				if (/^[-*]\s+.+/.test(trimmed)) {
					ingredientItemsCount++;
				}
			}
		}

		if (inHeadingSection && ingredientItemsCount > 0) {
			ingredientsFound = true;
		}
	}

	if (settings.enforceIngredients) {
		if (!ingredientsFound) {
			issues.push({
				filePath,
				fileName,
				severity: 'error',
				rule: 'missing-ingredients',
				message: 'Missing ingredients section.',
				suggestion:
					'Enclose ingredients in a bullet list between horizontal rules:\n---\n- *2 cups* flour\n- *1 tsp* salt\n---',
			});
		} else if (ingredientItemsCount === 0) {
			issues.push({
				filePath,
				fileName,
				line: ingredientsLine,
				severity: 'error',
				rule: 'empty-ingredients',
				message: 'Ingredient section found but contains no ingredient items.',
				suggestion: 'Add bullet points for ingredients (e.g. `- *1 cup* milk`).',
			});
		}
	}

	// 3. Locate Directions / Steps Section
	if (settings.enforceDirections) {
		let directionsFound = false;
		let numberedStepsCount = 0;
		let bulletStepsCount = 0;
		let directionsLine = 0;

		// Scan content following the ingredients block
		const searchStart = hrEndIndex > -1 ? hrEndIndex + 1 : 0;
		let insideDirectionsHeading = false;

		for (let i = searchStart; i < bodyLines.length; i++) {
			const rawLine = bodyLines[i];
			if (rawLine === undefined) continue;
			const line = rawLine.trim();

			// Stop if hitting Notes or metadata heading
			if (/^#{1,4}\s+(Notes|Nutrition|Source|Comments)/i.test(line)) {
				break;
			}

			if (/^#{1,4}\s+(Directions|Instructions|Steps|Method|Preparation)/i.test(line)) {
				insideDirectionsHeading = true;
				if (!directionsLine) directionsLine = fmLineCount + i + 1;
				continue;
			}

			if (/^\d+\.\s+.+/.test(line)) {
				numberedStepsCount++;
				if (!directionsLine) directionsLine = fmLineCount + i + 1;
			} else if (/^[-*]\s+.+/.test(line)) {
				bulletStepsCount++;
				if (!directionsLine) directionsLine = fmLineCount + i + 1;
			}
		}

		if (numberedStepsCount > 0) {
			directionsFound = true;
		} else if (bulletStepsCount > 0) {
			directionsFound = true;
			if (settings.warnBulletDirections) {
				issues.push({
					filePath,
					fileName,
					line: directionsLine,
					severity: 'warning',
					rule: 'bullet-directions',
					message: 'Directions use bullet points instead of numbered steps.',
					suggestion:
						'RecipeMD standard recommends numbered steps (e.g. `1. Preheat oven...`).',
				});
			}
		}

		if (!directionsFound) {
			issues.push({
				filePath,
				fileName,
				severity: 'error',
				rule: 'missing-directions',
				message: 'Missing directions / instructions section.',
				suggestion:
					'Add numbered steps after the ingredients list (e.g. `1. Mix ingredients.`\n`2. Bake for 30 min.`).',
			});
		}
	}

	// 4. Optional: Check Yield / Servings
	if (settings.enforceYield) {
		const yieldRegex = /\*\*[^*]*(serving|servings|yield|portion|makes)[^*]*\*\*/i;
		const hasYield =
			yieldRegex.test(body) ||
			(hasFrontmatter &&
				/^(yield|servings|serving_size):/im.test(content.slice(0, fmInfo.contentStart)));

		if (!hasYield) {
			issues.push({
				filePath,
				fileName,
				severity: 'warning',
				rule: 'missing-yield',
				message: 'Missing yield or servings information.',
				suggestion: 'Add bold yield info before ingredients, e.g. `**4 servings**`.',
			});
		}
	}

	// 5. Optional: Check Tags / Keywords
	if (settings.enforceTags) {
		const tagsRegex = /\*[^*,\n]+(?:,[^*,\n]+)*\*/;
		const hasTags =
			tagsRegex.test(body) ||
			(hasFrontmatter &&
				/^tags:/im.test(content.slice(0, fmInfo.contentStart)));

		if (!hasTags) {
			issues.push({
				filePath,
				fileName,
				severity: 'warning',
				rule: 'missing-tags',
				message: 'Missing tags or keywords.',
				suggestion: 'Add italic tags before ingredients, e.g. `*dinner, easy, beef*`.',
			});
		}
	}

	// 6. Optional: Check Description
	if (settings.enforceDescription) {
		let hasDesc = false;
		let pastTitle = false;

		for (let i = 0; i < bodyLines.length; i++) {
			const rawLine = bodyLines[i];
			if (rawLine === undefined) continue;
			const line = rawLine.trim();

			if (/^#\s+/.test(line)) {
				pastTitle = true;
				continue;
			}
			if (/^(---|___|\*\*\*)$/.test(line)) {
				break;
			}
			if (pastTitle && line.length > 10 && !line.startsWith('*') && !line.startsWith('|')) {
				hasDesc = true;
				break;
			}
		}

		if (!hasDesc) {
			issues.push({
				filePath,
				fileName,
				severity: 'warning',
				rule: 'missing-description',
				message: 'Missing recipe description.',
				suggestion: 'Add a brief paragraph under the recipe title describing the dish.',
			});
		}
	}

	return issues;
}
