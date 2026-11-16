import {
	App,
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	TFile,
	TFolder,
} from 'obsidian';
import { RecipeMDBannerManager } from './banner';
import { lintRecipe } from './linter';
import { LintingResultModal } from './modal';
import { RecipeMDLinterSettingTab } from './settings';
import {
	DEFAULT_SETTINGS,
	FileLintResult,
	LintIssue,
	RecipeMDLinterSettings,
} from './types';

const RECIPEMD_TEMPLATE = `# Recipe Title

A brief description of this dish.

*tags, comma, separated*

**4 servings**

---

- *1 tbsp* olive oil
- *2 cloves* garlic, minced
- *1 lb* main ingredient

---

1. Preheat oven or prepare cooking station.
2. Combine ingredients and cook according to method.
3. Let rest, slice, and serve warm.

### Notes

Any tips, substitutions, or storage recommendations.
`;

export default class RecipeMDLinter extends Plugin {
	settings: RecipeMDLinterSettings;
	bannerManager: RecipeMDBannerManager;
	statusBarItemEl: HTMLElement | null = null;
	private debounceTimer: number | null = null;

	async onload() {
		await this.loadSettings();
		this.bannerManager = new RecipeMDBannerManager();

		// Status Bar Item
		if (this.settings.showStatusBarItem) {
			this.statusBarItemEl = this.addStatusBarItem();
			this.statusBarItemEl.addClass('plugin-recipemd-linter');
			this.statusBarItemEl.addEventListener('click', () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile && activeFile.extension === 'md') {
					this.lintActiveFile(activeFile);
				}
			});
		}

		// Command: Lint all files in configured directory
		this.addCommand({
			id: 'lint-recipemd-files',
			name: 'Lint RecipeMD files in folder',
			callback: () => {
				this.lintFolder();
			},
		});

		// Command: Lint active file
		this.addCommand({
			id: 'lint-active-recipemd-file',
			name: 'Lint active recipe',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile && activeFile.extension === 'md') {
					if (!checking) {
						this.lintActiveFile(activeFile);
					}
					return true;
				}
				return false;
			},
		});

		// Command: Insert RecipeMD Template
		this.addCommand({
			id: 'insert-recipemd-template',
			name: 'Insert RecipeMD template',
			editorCallback: (editor: Editor) => {
				editor.replaceSelection(RECIPEMD_TEMPLATE);
				new Notice('Inserted RecipeMD template');
			},
		});

		// Ribbon icon for quick linting
		this.addRibbonIcon('chef-hat', 'Lint RecipeMD files', () => {
			this.lintFolder();
		});

		this.addSettingTab(new RecipeMDLinterSettingTab(this.app, this));

		// Real-time Event Listeners
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.handleActiveLeafChange();
			})
		);

		this.registerEvent(
			this.app.workspace.on('editor-change', (editor) => {
				if (!this.settings.liveLinting) return;

				if (this.debounceTimer !== null) {
					window.clearTimeout(this.debounceTimer);
				}

				this.debounceTimer = window.setTimeout(() => {
					this.debounceTimer = null;
					const view = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (view && view.file) {
						this.lintView(view, editor.getValue());
					}
				}, 350);
			})
		);

		this.app.workspace.onLayoutReady(() => {
			this.handleActiveLeafChange();
		});
	}

	onunload() {
		if (this.bannerManager) {
			this.bannerManager.removeAll();
		}
		if (this.statusBarItemEl) {
			this.statusBarItemEl.remove();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private isIgnored(fileName: string): boolean {
		if (!this.settings.ignoredFiles) return false;
		const ignored = this.settings.ignoredFiles
			.split(',')
			.map((s) => s.trim().toLowerCase())
			.filter((s) => s.length > 0);

		const lowerName = fileName.toLowerCase();
		return ignored.some(
			(pattern) => lowerName === pattern || lowerName.includes(pattern)
		);
	}

	isRecipeFile(file: TFile | null): boolean {
		if (!file || file.extension !== 'md') return false;
		if (this.isIgnored(file.name)) return false;
		if (this.settings.lintDirectory) {
			return (
				file.path.startsWith(this.settings.lintDirectory + '/') ||
				file.path === this.settings.lintDirectory
			);
		}
		return true;
	}

	private getMarkdownFilesRecursive(folder: TFolder): TFile[] {
		let files: TFile[] = [];
		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === 'md') {
				if (!this.isIgnored(child.name)) {
					files.push(child);
				}
			} else if (child instanceof TFolder) {
				files = files.concat(this.getMarkdownFilesRecursive(child));
			}
		}
		return files;
	}

	handleActiveLeafChange() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view && view.file) {
			this.lintView(view);
		} else {
			this.updateStatusBar(null, []);
		}
	}

	refreshActiveView() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			this.lintView(view);
		}
	}

	lintView(view: MarkdownView, content?: string) {
		const file = view.file;
		if (!file || !this.isRecipeFile(file)) {
			this.bannerManager.remove(view);
			this.updateStatusBar(null, []);
			return;
		}

		const rawContent = content ?? view.editor.getValue();
		const issues = lintRecipe(rawContent, file.path, file.name, this.settings);

		if (this.settings.showInlineBanner) {
			this.bannerManager.update(view, file, issues);
		} else {
			this.bannerManager.remove(view);
		}

		if (this.settings.showStatusBarItem) {
			this.updateStatusBar(file, issues);
		}
	}

	private updateStatusBar(file: TFile | null, issues: LintIssue[]) {
		if (!this.statusBarItemEl) return;

		if (!file || !this.settings.showStatusBarItem) {
			this.statusBarItemEl.setText('');
			this.statusBarItemEl.removeAttribute('title');
			return;
		}

		if (issues.length === 0) {
			this.statusBarItemEl.setText('🍳 RecipeMD: ✅ Valid');
			this.statusBarItemEl.setAttribute(
				'title',
				`${file.basename} is compliant with RecipeMD (Click to re-lint)`
			);
		} else {
			const errors = issues.filter((i) => i.severity === 'error').length;
			const warnings = issues.filter((i) => i.severity === 'warning').length;
			const textParts: string[] = [];
			if (errors > 0) textParts.push(`${errors} error${errors > 1 ? 's' : ''}`);
			if (warnings > 0) textParts.push(`${warnings} warning${warnings > 1 ? 's' : ''}`);
			this.statusBarItemEl.setText(`🍳 RecipeMD: ⚠️ ${textParts.join(', ')}`);
			this.statusBarItemEl.setAttribute(
				'title',
				`${issues.length} issue(s) in ${file.basename} (Click to open report)`
			);
		}
	}

	async lintFolder() {
		const lintDirectory = this.settings.lintDirectory;
		if (!lintDirectory) {
			new Notice('Please set the directory to lint in the RecipeMD Linter settings.');
			return;
		}

		const folder = this.app.vault.getAbstractFileByPath(lintDirectory);
		if (!(folder instanceof TFolder)) {
			new Notice(`The directory "${lintDirectory}" does not exist in your vault.`);
			return;
		}

		const files = this.getMarkdownFilesRecursive(folder);
		if (files.length === 0) {
			new Notice(`No markdown files found in "${lintDirectory}".`);
			return;
		}

		const results: FileLintResult[] = [];

		for (const file of files) {
			const content = await this.app.vault.cachedRead(file);
			const issues = lintRecipe(content, file.path, file.name, this.settings);
			if (issues.length > 0) {
				results.push({
					file: file.basename,
					filePath: file.path,
					issues,
				});
			}
		}

		if (results.length === 0) {
			new Notice(`🎉 All ${files.length} recipes in "${lintDirectory}" are compliant with RecipeMD!`);
		} else {
			new LintingResultModal(this.app, results, files.length).open();
		}
	}

	async lintActiveFile(file: TFile) {
		const content = await this.app.vault.cachedRead(file);
		const issues = lintRecipe(content, file.path, file.name, this.settings);

		if (issues.length === 0) {
			new Notice(`✅ "${file.basename}" is fully compliant with RecipeMD!`);
		} else {
			const results: FileLintResult[] = [
				{
					file: file.basename,
					filePath: file.path,
					issues,
				},
			];
			new LintingResultModal(this.app, results, 1).open();
		}
	}
}
