import { readFileSync } from "node:fs";
import { join } from "node:path";

// Carrega o hand history mockado de para os testes em __fixtures__.

export const fixture = readFileSync(
  join(__dirname, "../__fixtures__/hh-octavia-ii-2026-08-12.txt"),
  "utf-8",
);
