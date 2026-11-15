#!/usr/bin/env node
// Gate de fronteira de módulo oficial: o código só alcança a Foundation pelas fachadas
// públicas `@devtrack-solution/foundation-api/contracts` e `/nest` (spec foundation-distribution).
// Uso: node scripts/check-boundaries.mjs [--root <diretório do pacote>]
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const FOUNDATION_PACKAGE = '@devtrack-solution/foundation-api';
const LEGACY_FOUNDATION_PACKAGE = 'foundation-api';
const PUBLIC_ENTRYPOINTS = new Set([`${FOUNDATION_PACKAGE}/contracts`, `${FOUNDATION_PACKAGE}/nest`]);
const IMPORT_PATTERNS = [
  /\bimport\s+(?:type\s+)?[\s\S]*?\s*from\s*['"]([^'"]+)['"]/g,
  /\bexport\s+(?:type\s+)?[\s\S]*?\s*from\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
];

/** Lista violações em `src/` do pacote. [] quando a fronteira está íntegra. */
export function findBoundaryViolations(root) {
  const violations = [];
  const srcRoot = join(root, 'src');
  for (const file of listSources(srcRoot)) {
    const text = readFileSync(file, 'utf8');
    for (const pattern of IMPORT_PATTERNS) {
      for (const match of text.matchAll(pattern)) {
        const specifier = match[1];
        const reason = violationReason(file, srcRoot, specifier);
        if (reason !== undefined)
          violations.push({ file: relative(root, file), line: text.slice(0, match.index).split('\n').length, specifier, reason });
      }
    }
  }
  return violations;
}

function violationReason(file, srcRoot, specifier) {
  if (specifier.startsWith('.')) {
    const target = resolve(dirname(file), specifier);
    if (target !== srcRoot && !target.startsWith(srcRoot + sep)) return 'importa caminho relativo fora de src/ do pacote';
    return undefined;
  }
  if (PUBLIC_ENTRYPOINTS.has(specifier)) return undefined;
  for (const name of [FOUNDATION_PACKAGE, LEGACY_FOUNDATION_PACKAGE])
    if (specifier === name || specifier.startsWith(`${name}/`))
      return `somente ${[...PUBLIC_ENTRYPOINTS].join(' e ')} são permitidos`;
  return undefined;
}

function listSources(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return listSources(path);
    return /\.ts$/.test(entry) && !entry.endsWith('.d.ts') ? [path] : [];
  });
}

function main(argv) {
  const index = argv.indexOf('--root');
  const root = resolve(index === -1 ? join(dirname(fileURLToPath(import.meta.url)), '..') : argv[index + 1]);
  const violations = findBoundaryViolations(root);
  for (const v of violations) console.error(`[BOUNDARY] ${v.file}:${v.line} ${v.specifier} — ${v.reason}`);
  if (violations.length === 0) {
    // Em hooks do npm (prepack) a stdout se mistura com a saída de `npm pack --json`.
    const log = process.env.npm_lifecycle_event?.startsWith('pre') ? console.error : console.log;
    log('[BOUNDARY] fronteira íntegra');
  }
  return violations.length === 0 ? 0 : 1;
}

// Executado diretamente (inclusive via symlink de node_modules ou shim de .bin): compara caminhos reais.
const invokedPath = process.argv[1] ? realpathSync(resolve(process.argv[1])) : undefined;
if (invokedPath === realpathSync(fileURLToPath(import.meta.url))) process.exit(main(process.argv));
