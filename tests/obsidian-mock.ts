/**
 * Lightweight mock of the Obsidian API for running unit tests in Node.js / CI.
 */

export interface FrontMatterInfo {
	exists: boolean;
	contentStart: number;
	contentEnd: number;
	frontmatter: string;
}

export function getFrontMatterInfo(content: string): FrontMatterInfo {
	if (!content.startsWith('---')) {
		return { exists: false, contentStart: 0, contentEnd: 0, frontmatter: '' };
	}

	const endMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
	if (endMatch && endMatch[0]) {
		return {
			exists: true,
			contentStart: endMatch[0].length,
			contentEnd: endMatch[0].length,
			frontmatter: endMatch[1] || '',
		};
	}

	return { exists: false, contentStart: 0, contentEnd: 0, frontmatter: '' };
}
