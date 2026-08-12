import { readFileSync } from "node:fs";
import { join } from "node:path";

// Carrega o hand history de referência num lugar só. Cada teste resolvia o path por conta
// própria, o que quebrou todo de uma vez quando os testes mudaram de pasta.

export const fixture = readFileSync(
  join(__dirname, "../__fixtures__/hh-octavia-ii-2026-08-12.txt"),
  "utf-8",
);
