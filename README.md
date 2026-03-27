# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

# Using Capacitor with React + TypeScript + Vite

To use Capacitor with this React + TypeScript + Vite template, you can follow these steps:

1. Install Capacitor CLI globally if you haven't already:
   ```bash
   npm install -g @capacitor/cli
   ```
2. Initialize Capacitor in your project:
   ```bash
   npx cap init [appName] [appId]
   ```
   Replace `[appName]` with the name of your app and `[appId]` with a unique identifier (e.g., `com.example.app`).
3. Add the desired platforms (e.g., iOS, Android):
   ```bash
   npx cap add ios
   npx cap add android
   ```
4. Build your React app:
   ```bash
   npm run build
   ```
5. Copy the built files to the native platform:
   ```bash
   npx cap copy
   ```
6. Open the native project in the respective IDE (e.g., Xcode for iOS, Android Studio for Android):
   ```bash
   npx cap open ios
   npx cap open android
   ```
7. Run the app on the desired platform using the IDE or command line.
8. For development, you can use the Vite dev server and sync changes to the native platform:
   ```bash
   npm run dev
   npx cap sync
   ```
   This will allow you to see changes in real-time on the native platform while developing your React app.
9. For production builds, make sure to build your React app and copy the files to the native platform before creating the final build for distribution.
   ```bash
   npm run build
   npx cap copy
   ```

# Project already includes capacitor android and ios

You can run the following commands to run the app on the respective platforms:

```bash
npx cap open ios
npx cap open android
```

if you change the code using Visual Studio Code, than run the following command to sync the changes to the native platform:

```bash
npx cap sync
```
