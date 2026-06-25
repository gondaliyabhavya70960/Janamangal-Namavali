import next from "eslint-config-next";
import prettier from "eslint-config-prettier";

/** ESLint 9 flat config (required by Next.js 16). */
const eslintConfig = [
  { ignores: ["public/sw.js", "node_modules/**", ".next/**", "out/**", "scripts/**"] },
  ...next,
  prettier,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      "prefer-const": "warn",
      // React-Compiler-aligned rules introduced in eslint-plugin-react-hooks v6
      // (enabled as errors by next/core-web-vitals in Next 16). They over-flag
      // intentional, correct patterns we rely on: one-time SSR-safe client
      // initialisation in effects (mount flags, online/media reads, prop-driven
      // resets) and Date.now() timestamps generated inside event handlers.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
];

export default eslintConfig;
