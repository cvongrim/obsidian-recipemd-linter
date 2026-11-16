import { App, MarkdownView, Modal, Notice, setIcon } from 'obsidian';
import { FileLintResult, LintIssue } from './types';

export class LintingResultModal extends Modal {
	results: FileLintResult[];
	totalFilesScanned: number;

	constructor(app: App, results: FileLintResult[], totalFilesScanned: number) {
		super(app);
		this.results = results.filter((r) => r.issues.length > 0);
		this.totalFilesScanned = totalFilesScanned;
	}

	onOpen() {
		const { contentEl } = this;
		this.modalEl.addClass('recipemd-modal-container');
		this.modalEl.style.width = '680px';
		this.modalEl.style.maxWidth = '90vw';

		contentEl.empty();
		contentEl.addClass('recipemd-linter-modal');

		// Header
		const header = contentEl.createDiv({ cls: 'recipemd-modal-header' });
		header.createEl('h2', { text: 'RecipeMD Linting Results' });

		// Calculate stats
		const totalIssues = this.results.reduce((acc, r) => acc + r.issues.length, 0);
		const totalErrors = this.results.reduce(
			(acc, r) => acc + r.issues.filter((i) => i.severity === 'error').length,
			0
		);
		const totalWarnings = this.results.reduce(
			(acc, r) => acc + r.issues.filter((i) => i.severity === 'warning').length,
			0
		);
		const passingFiles = Math.max(0, this.totalFilesScanned - this.results.length);

		// Summary Stats Bar
		const statsBar = contentEl.createDiv({ cls: 'recipemd-stats-bar' });
		statsBar.createDiv({
			cls: 'recipemd-stat-item',
			text: `Scanned: ${this.totalFilesScanned} files`,
		});
		statsBar.createDiv({
			cls: 'recipemd-stat-item recipemd-stat-success',
			text: `Compliant: ${passingFiles}`,
		});
		if (totalErrors > 0) {
			statsBar.createDiv({
				cls: 'recipemd-stat-item recipemd-stat-error',
				text: `Errors: ${totalErrors}`,
			});
		}
		if (totalWarnings > 0) {
			statsBar.createDiv({
				cls: 'recipemd-stat-item recipemd-stat-warning',
				text: `Warnings: ${totalWarnings}`,
			});
		}

		// Empty State
		if (this.results.length === 0) {
			const emptyState = contentEl.createDiv({ cls: 'recipemd-empty-state' });
			emptyState.createEl('div', {
				cls: 'recipemd-empty-icon',
				text: '🎉',
			});
			emptyState.createEl('h3', { text: 'All recipes are compliant!' });
			emptyState.createEl('p', {
				text: `All ${this.totalFilesScanned} scanned files follow the RecipeMD specification.`,
			});
			return;
		}

		// List of Files with issues
		const resultsContainer = contentEl.createDiv({ cls: 'recipemd-results-container' });

		for (const fileResult of this.results) {
			const fileCard = resultsContainer.createDiv({ cls: 'recipemd-file-card' });

			// File Header
			const fileHeader = fileCard.createDiv({ cls: 'recipemd-file-header' });
			const fileTitle = fileHeader.createDiv({ cls: 'recipemd-file-title' });
			fileTitle.createEl('strong', { text: fileResult.file });
			fileTitle.createEl('span', {
				cls: 'recipemd-file-path',
				text: ` (${fileResult.filePath})`,
			});

			const openBtn = fileHeader.createEl('button', {
				cls: 'recipemd-open-btn mod-cta',
				text: 'Open File',
			});
			openBtn.addEventListener('click', () => {
				this.app.workspace.openLinkText(fileResult.filePath, fileResult.filePath);
			});

			// Issue Items
			const issuesList = fileCard.createDiv({ cls: 'recipemd-issues-list' });

			for (const issue of fileResult.issues) {
				const issueRow = issuesList.createDiv({
					cls: `recipemd-issue-row recipemd-severity-${issue.severity}`,
				});

				const metaRow = issueRow.createDiv({ cls: 'recipemd-issue-meta' });

				metaRow.createSpan({
					cls: `recipemd-badge recipemd-badge-${issue.severity}`,
					text: issue.severity.toUpperCase(),
				});

				if (issue.line) {
					const lineTag = metaRow.createSpan({
						cls: 'recipemd-line-tag',
						text: `Line ${issue.line}`,
					});
					lineTag.addEventListener('click', () => {
						this.openFileLine(fileResult.filePath, issue.line!);
					});
				}

				issueRow.createDiv({
					cls: 'recipemd-issue-message',
					text: issue.message,
				});

				if (issue.suggestion) {
					const suggestionEl = issueRow.createDiv({
						cls: 'recipemd-issue-suggestion',
					});
					suggestionEl.createEl('span', { text: '💡 ' + issue.suggestion });
				}
			}
		}

		// Action Buttons at bottom
		const footer = contentEl.createDiv({ cls: 'recipemd-modal-footer' });

		const copyBtn = footer.createEl('button', {
			text: 'Copy Report',
		});
		copyBtn.addEventListener('click', () => {
			const textReport = this.generateTextReport();
			navigator.clipboard.writeText(textReport);
			new Notice('Linting report copied to clipboard!');
		});

		const closeBtn = footer.createEl('button', {
			cls: 'mod-primary',
			text: 'Close',
		});
		closeBtn.addEventListener('click', () => {
			this.close();
		});
	}

	private async openFileLine(filePath: string, line: number) {
		const leaf = this.app.workspace.getLeaf(false);
		await this.app.workspace.openLinkText(filePath, filePath, false);
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view && view.editor) {
			view.editor.setCursor({ line: Math.max(0, line - 1), ch: 0 });
			view.editor.scrollIntoView({
				from: { line: Math.max(0, line - 1), ch: 0 },
				to: { line: Math.max(0, line - 1), ch: 0 },
			});
		}
	}

	private generateTextReport(): string {
		let report = `# RecipeMD Lint Report\n`;
		report += `Total Scanned: ${this.totalFilesScanned} | Files with Issues: ${this.results.length}\n\n`;

		for (const r of this.results) {
			report += `## ${r.file} (${r.filePath})\n`;
			for (const issue of r.issues) {
				const lineStr = issue.line ? `[Line ${issue.line}] ` : '';
				report += `- **${issue.severity.toUpperCase()}** ${lineStr}: ${issue.message}\n`;
				if (issue.suggestion) {
					report += `  Suggestion: ${issue.suggestion}\n`;
				}
			}
			report += '\n';
		}
		return report;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
