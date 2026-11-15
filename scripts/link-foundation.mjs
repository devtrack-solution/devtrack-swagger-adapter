#!/usr/bin/env node
// Desenvolvimento no workspace: aponta node_modules/@devtrack-solution/foundation-api para o checkout irmão
// ../foundation-api quando ele existe. Fora do workspace (repositório isolado), não faz nada e a
// Foundation vem do registry. Nunca grava `file:` no package.json (spec foundation-distribution).
import { existsSync, lstatSync, mkdirSync, readlinkSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const foundationRoot = resolve(packageRoot, '..', 'foundation-api');
const linkPath = join(packageRoot, 'node_modules', '@devtrack-solution', 'foundation-api');

if (!existsSync(join(foundationRoot, 'package.json'))) process.exit(0);
mkdirSync(dirname(linkPath), { recursive: true });
const target = relative(dirname(linkPath), foundationRoot);
const current = lstatSync(linkPath, { throwIfNoEntry: false });
if (current?.isSymbolicLink() && readlinkSync(linkPath) === target) process.exit(0);
if (current !== undefined) rmSync(linkPath, { recursive: true, force: true });
symlinkSync(target, linkPath, 'dir');
