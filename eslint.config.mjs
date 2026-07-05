import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Copy-heavy prototype: real apostrophes in JSX text are fine.
      "react/no-unescaped-entities": "off"
    }
  }
];

export default eslintConfig;
