import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    // 打包产物与本机工具链
    "dist/**",
    "android/**",
    "resources/**",
    "electron/**",
  ]),
  // Relax React Compiler refs rule — our draftValuesRef pattern is intentional:
  // refs store mutable draft values during rapid scrolling; state would cause stale closures
  // in cached wheel handlers. Draft values are rendered via draftVersion state counter.
  { rules: { 'react-hooks/refs': 'off' } },
]);

export default eslintConfig;
