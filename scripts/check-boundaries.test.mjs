import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { findBoundaryViolations } from './check-boundaries.mjs';

function violationsFor(source) {
  const root = mkdtempSync(join(tmpdir(), 'module-boundary-'));
  try {
    mkdirSync(join(root, 'src', 'inner'), { recursive: true });
    writeFileSync(join(root, 'src', 'inner', 'sample.ts'), source);
    return findBoundaryViolations(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const rejected = [
  ['caminho interno da Foundation', "import { x } from '@devtrack/foundation-api/dist/core/x';"],
  ['raiz da Foundation', "import { x } from '@devtrack/foundation-api';"],
  ['subpath nativo da Foundation', "import { x } from '@devtrack/foundation-api/native/persistence-typeorm';"],
  ['nome antigo sem escopo', "import { x } from 'foundation-api/contracts';"],
  ['relativo que sai de src', "import { x } from '../../../foundation-api/src/core/x';"],
  ['require de interno', "const x = require('@devtrack/foundation-api/dist/x');"],
];
for (const [label, source] of rejected) {
  test(`reprova ${label}`, () => {
    assert.equal(violationsFor(source).length, 1, source);
  });
}

const accepted = [
  ['contracts', "import type { Clock } from '@devtrack/foundation-api/contracts';"],
  ['nest', "import { FoundationCoreModule } from '@devtrack/foundation-api/nest';"],
  ['relativo dentro de src', "import { y } from '../index';"],
  ['dependência própria', "import { DocumentBuilder } from '@nestjs/swagger';"],
];
for (const [label, source] of accepted) {
  test(`aceita ${label}`, () => {
    assert.deepEqual(violationsFor(source), []);
  });
}

test('o código do pacote respeita a fronteira', () => {
  assert.deepEqual(findBoundaryViolations(join(import.meta.dirname, '..')), []);
});
