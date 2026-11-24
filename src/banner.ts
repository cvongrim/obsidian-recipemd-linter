import { MarkdownView, setIcon, TFile } from 'obsidian';
import { LintIssue } from './types';

export class RecipeMDBannerManager {
	private collapsedViews = new WeakMap<MarkdownView, boolean>();

	/**
	 * Updates or creates the inline banner for an active MarkdownView.
	 */
	update(view: MarkdownView, file: TFile, issues: LintIssue[]) {
		const container = view.containerEl;
		let banner = container.querySelector<HTMLElement>(':scope > .recipemd-inline-banner');

		if (issues.length === 0) {
			if (banner) {
				banner.remove();
			}
			return;
		}

		if (!banner) {
			banner = createDiv({ cls: 'recipemd-inline-banner' });
			// Place between view header and view content if possible
			if (view.contentEl && view.contentEl.parentElement === container) {
				container.insertBefore(banner, view.contentEl);
			} else {
				container.prepend(banner);
			}
		}

		const isCollapsed = this.collapsedViews.get(view) ?? false;
		banner.empty();

		const errorCount = issues.filter((i) => i.severity === 'error').length;
		const warningCount = issues.filter((i) => i.severity === 'warning').length;
		const hasErrors = errorCount > 0;

		banner.addClass(hasErrors ? 'banner-has-errors' : 'banner-has-warnings');
		banner.removeClass(hasErrors ? 'banner-has-warnings' : 'banner-has-errors');

		// Banner Header
		const header = banner.createDiv({ cls: 'recipemd-banner-header' });

		const headerLeft = header.createDiv({ cls: 'recipemd-banner-header-left' });
		const statusIcon = headerLeft.createSpan({ cls: 'recipemd-banner-icon' });
		setIcon(statusIcon, hasErrors ? 'alert-octagon' : 'alert-triangle');

		const titleText = headerLeft.createSpan({ cls: 'recipemd-banner-title' });
		const parts: string[] = [];
		if (errorCount > 0) parts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`);
		if (warningCount > 0) parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
		titleText.setText(`RecipeMD: ${parts.join(', ')} found`);

		const headerRight = header.createDiv({ cls: 'recipemd-banner-header-right' });

		// Collapse/Expand toggle button
		const toggleBtn = headerRight.createEl('button', {
			cls: 'recipemd-banner-toggle-btn clickable-icon',
			attr: { 'aria-label': isCollapsed ? 'Expand issues' : 'Collapse issues' },
		});
		setIcon(toggleBtn, isCollapsed ? 'chevron-down' : 'chevron-up');
		toggleBtn.addEventListener('click', () => {
			const nextState = !isCollapsed;
			this.collapsedViews.set(view, nextState);
			this.update(view, file, issues);
		});

		// Dismiss / Close button
		const closeBtn = headerRight.createEl('button', {
			cls: 'recipemd-banner-close-btn clickable-icon',
			attr: { 'aria-label': 'Dismiss banner' },
		});
		setIcon(closeBtn, 'x');
		closeBtn.addEventListener('click', () => {
			banner?.remove();
		});

		// Banner Body (Issues List)
		if (!isCollapsed) {
			const body = banner.createDiv({ cls: 'recipemd-banner-body' });

			for (const issue of issues) {
				const row = body.createDiv({
					cls: `recipemd-banner-issue-row severity-${issue.severity}`,
				});

				const rowHeader = row.createDiv({ cls: 'recipemd-banner-issue-header' });

				rowHeader.createSpan({
					cls: `recipemd-badge recipemd-badge-${issue.severity}`,
					text: issue.severity.toUpperCase(),
				});

				if (issue.line) {
					const lineBtn = rowHeader.createSpan({
						cls: 'recipemd-banner-line-tag',
						text: `Line ${issue.line}`,
						attr: { title: `Click to jump to line ${issue.line}` },
					});
					lineBtn.addEventListener('click', () => {
						this.jumpToLine(view, issue.line!);
					});
				}

				row.createDiv({
					cls: 'recipemd-banner-issue-msg',
					text: issue.message,
				});

				if (issue.suggestion) {
					const hint = row.createDiv({ cls: 'recipemd-banner-issue-hint' });
					hint.createSpan({ text: '💡 ' + issue.suggestion });
				}
			}
		}
	}

	private jumpToLine(view: MarkdownView, line: number) {
		const targetLine = Math.max(0, line - 1);
		view.editor.setCursor({ line: targetLine, ch: 0 });
		view.editor.scrollIntoView(
			{
				from: { line: targetLine, ch: 0 },
				to: { line: targetLine, ch: 0 },
			},
			true
		);
		view.editor.focus();
	}

	remove(view: MarkdownView) {
		const banner = view.containerEl.querySelector(':scope > .recipemd-inline-banner');
		if (banner) {
			banner.remove();
		}
	}

	removeAll() {
		activeDocument
			.querySelectorAll('.recipemd-inline-banner')
			.forEach((el) => el.remove());
	}
}
