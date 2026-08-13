import { readFileSync } from "node:fs";
import { join } from "node:path";

// Carrega o hand history mockado de para os testes em __fixtures__.

export const fixture = readFileSync(
  join(__dirname, "../__fixtures__/hh-octavia-ii-2026-08-12.txt"),
  "utf-8",
);

// Segundo fixture: 4 mãos da Fantasia II com as variações de formato que a Octavia II
// nunca teve — BOM, hora de 1 dígito, side pot, fold expondo cartas e desconexões.
export const fantasiaFixture = readFileSync(
  join(__dirname, "../__fixtures__/hh-fantasia-ii-2026-08-13.txt"),
  "utf-8",
);