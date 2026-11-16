export type LintSeverity = 'error' | 'warning';

export interface LintIssue {
	filePath: string;
	fileName: string;
	line?: number;
	severity: LintSeverity;
	rule: string;
	message: string;
	suggestion?: string;
}

export interface FileLintResult {
	file: string;
	filePath: string;
	issues: LintIssue[];
}

export interface RecipeMDLinterSettings {
	lintDirectory: string;
	ignoredFiles: string;
	recipeFormatEnforcement: 'strict' | 'flexible';
	enforceTitle: boolean;
	enforceIngredients: boolean;
	enforceDirections: boolean;
	warnBulletDirections: boolean;
	enforceYield: boolean;
	enforceTags: boolean;
	enforceDescription: boolean;
	showInlineBanner: boolean;
	liveLinting: boolean;
	showStatusBarItem: boolean;
}

export const DEFAULT_SETTINGS: RecipeMDLinterSettings = {
	lintDirectory: 'MealPlan',
	ignoredFiles: 'Meal Plan.md, Shopping List.md',
	recipeFormatEnforcement: 'flexible',
	enforceTitle: true,
	enforceIngredients: true,
	enforceDirections: true,
	warnBulletDirections: true,
	enforceYield: false,
	enforceTags: false,
	enforceDescription: false,
	showInlineBanner: true,
	liveLinting: true,
	showStatusBarItem: true,
};
