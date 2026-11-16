import { App, PluginSettingTab, Setting } from 'obsidian';
import RecipeMDLinter from './main';

export class RecipeMDLinterSettingTab extends PluginSettingTab {
	plugin: RecipeMDLinter;

	constructor(app: App, plugin: RecipeMDLinter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'RecipeMD Linter Settings' });

		new Setting(containerEl)
			.setName('Directory to Lint')
			.setDesc('Vault folder containing your recipe files.')
			.addText((text) =>
				text
					.setPlaceholder('MealPlan')
					.setValue(this.plugin.settings.lintDirectory)
					.onChange(async (value) => {
						this.plugin.settings.lintDirectory = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Ignored Files')
			.setDesc('Comma-separated list of file names or patterns to ignore (e.g. non-recipe notes).')
			.addText((text) =>
				text
					.setPlaceholder('Meal Plan.md, Shopping List.md')
					.setValue(this.plugin.settings.ignoredFiles)
					.onChange(async (value) => {
						this.plugin.settings.ignoredFiles = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Recipe Format Enforcement')
			.setDesc(
				'Flexible accepts either standard RecipeMD (--- blocks) or markdown headings (## Ingredients). Strict strictly requires standard RecipeMD format.'
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption('flexible', 'Flexible (--- delimiters or # Headings)')
					.addOption('strict', 'Strict (Standard RecipeMD --- delimiters)')
					.setValue(this.plugin.settings.recipeFormatEnforcement)
					.onChange(async (value: 'strict' | 'flexible') => {
						this.plugin.settings.recipeFormatEnforcement = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl('h3', { text: 'Core Structure Rules' });

		new Setting(containerEl)
			.setName('Require Recipe Title')
			.setDesc('Ensure the note has a top-level `# Recipe Title` heading.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enforceTitle)
					.onChange(async (value) => {
						this.plugin.settings.enforceTitle = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Require Ingredients')
			.setDesc('Ensure recipes include a bullet list of ingredients.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enforceIngredients)
					.onChange(async (value) => {
						this.plugin.settings.enforceIngredients = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Require Directions')
			.setDesc('Ensure recipes include instructions/directions.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enforceDirections)
					.onChange(async (value) => {
						this.plugin.settings.enforceDirections = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Warn on Bulleted Directions')
			.setDesc('Warn when directions use bullet points instead of numbered steps (1., 2., etc.).')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.warnBulletDirections)
					.onChange(async (value) => {
						this.plugin.settings.warnBulletDirections = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl('h3', { text: 'Optional Recipe Elements' });

		new Setting(containerEl)
			.setName('Enforce Servings / Yield')
			.setDesc('Warn if recipe does not specify yield (e.g. **4 servings**).')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enforceYield)
					.onChange(async (value) => {
						this.plugin.settings.enforceYield = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Enforce Tags')
			.setDesc('Warn if recipe is missing italic tags (e.g. *dinner, quick*).')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enforceTags)
					.onChange(async (value) => {
						this.plugin.settings.enforceTags = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Enforce Description')
			.setDesc('Warn if recipe lacks a short introductory description under the title.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enforceDescription)
					.onChange(async (value) => {
						this.plugin.settings.enforceDescription = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl('h3', { text: 'Inline Feedback & UI' });

		new Setting(containerEl)
			.setName('Show Inline Banner in Active Note')
			.setDesc('Display an expandable error/warning banner directly above the recipe in the editor.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showInlineBanner)
					.onChange(async (value) => {
						this.plugin.settings.showInlineBanner = value;
						await this.plugin.saveSettings();
						this.plugin.refreshActiveView();
					})
			);

		new Setting(containerEl)
			.setName('Live Linting (Real-Time)')
			.setDesc('Automatically re-lint and update the inline banner as you type.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.liveLinting)
					.onChange(async (value) => {
						this.plugin.settings.liveLinting = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Show Status Bar Indicator')
			.setDesc('Show recipe status (e.g. "🍳 RecipeMD: 2 issues") in the bottom status bar.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showStatusBarItem)
					.onChange(async (value) => {
						this.plugin.settings.showStatusBarItem = value;
						await this.plugin.saveSettings();
						this.plugin.refreshActiveView();
					})
			);
	}
}
