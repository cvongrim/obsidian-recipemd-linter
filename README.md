# RecipeMD Linter for Obsidian

A user-friendly Obsidian plugin that validates and lints markdown recipes against the [RecipeMD specification](https://recipemd.org). Features real-time inline feedback, one-click line navigation, and bulk recipe checking.

![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-blue?logo=obsidian)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## Features

- **Live Inline Feedback**: Displays an unobtrusive, collapsible warning and error banner pinned directly above the active recipe in your editor.
- **Real-Time Linting**: Re-evaluates as you type so issues disappear the moment you fix them.
- **One-Click Line Navigation**: Click any `Line X` tag in the banner or modal to scroll and jump your cursor directly to the issue.
- **True RecipeMD Compliance**:
  - Validates top-level `# Recipe Title`.
  - Validates ingredient blocks enclosed between `---` horizontal rules.
  - Validates numbered steps (`1.`, `2.`) for cooking directions.
  - Tolerates frontmatter and metadata tables without breaking.
- **Flexible Mode**: Also supports recipes using `# Ingredients` and `# Directions` headings.
- **Template Generator**: Run `RecipeMD Linter: Insert RecipeMD template` to quickly scaffold a new recipe note.
- **Status Bar Pill**: Shows live recipe compliance (`🍳 RecipeMD: ✅ Valid` or `🍳 RecipeMD: ⚠️ 2 warnings`) in the bottom right corner.
- **Vault/Folder Linting**: Scan your entire meal plan or recipe directory at once, complete with a structured results modal and a "Copy Report" button.
- **Ignore Lists**: Exclude non-recipe notes like `Meal Plan.md` or `Shopping List.md`.

---

## Compliant RecipeMD Example

```markdown
# Mom's Meatloaf

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
2. In a large mixing bowl, combine ingredients until well blended.
3. Shape into a loaf in a 9x5-inch pan.
4. Bake at 350°F for 1 hour, or until internal temperature reaches 160°F.
5. Let rest for 10 minutes before slicing.

### Notes

Any tips, substitutions, or photos:
![[photo.webp]]
```

---

## Commands

| Command | Description |
| :--- | :--- |
| **Lint active recipe** | Validates the currently opened note with instant feedback. |
| **Lint RecipeMD files in folder** | Scans all recipes in your configured recipe folder. |
| **Insert RecipeMD template** | Pastes a clean, compliant RecipeMD template at the cursor. |

---

## Installation

### Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [Release](https://github.com/your-username/recipemd-linter/releases).
2. Create a folder named `recipemd-linter` inside your vault's `.obsidian/plugins/` directory.
3. Copy the files into `.obsidian/plugins/recipemd-linter/`.
4. Open **Settings → Community plugins** in Obsidian and enable **RecipeMD Linter**.

### Via BRAT
1. Install the [Obsidian42 - BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin.
2. Run command `BRAT: Add a beta plugin for testing`.
3. Paste the URL of this repository.

---

## Settings

* **Directory to Lint**: The folder containing your recipes (e.g. `MealPlan` or `Recipes`).
* **Ignored Files**: Comma-separated list of notes to skip (e.g. `Meal Plan.md, Shopping List.md`).
* **Recipe Format Enforcement**:
  * **Flexible** *(Recommended)*: Accepts standard RecipeMD `---` blocks or `# Headings`.
  * **Strict**: Strictly enforces `---` horizontal rules for ingredients.
* **Core Structure Rules**:
  * Require `# Recipe Title`
  * Require Ingredients list
  * Require Directions / steps
  * Warn if directions use bullet points instead of numbers
* **Optional Rules**:
  * Enforce Servings / Yield (`**4 servings**`)
  * Enforce Tags (`*dinner, quick*`)
  * Enforce Description paragraph
* **Inline Feedback**: Toggle real-time inline banners and the status bar indicator.

---

## Development

```bash
# Clone the repository
git clone https://github.com/your-username/recipemd-linter.git

# Install dependencies
npm install

# Start development watch mode
npm run dev

# Build for production
npm run build
```

---

## License

This project is licensed under the [MIT License](LICENSE).
