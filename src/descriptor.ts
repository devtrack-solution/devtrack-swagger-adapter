import type { ModuleDescriptor } from '@devtrack-solution/foundation-api/contracts';
import descriptorFile from './swagger-adapter.descriptor.json';

/**
 * Descriptor de metadata pura. A fonte é `swagger-adapter.descriptor.json`, o mesmo arquivo
 * publicado em `exports['./descriptor']` e lido pelo api-cli. Este módulo só acrescenta a
 * origem npm para composição em processo; `integrity` é placeholder de desenvolvimento.
 */
export const SWAGGER_ADAPTER_MODULE_ID = descriptorFile.id;

export const swaggerAdapterModuleDescriptor: ModuleDescriptor = {
  id: descriptorFile.id,
  foundationApiMajor: 1,
  origin: {
    kind: 'npm',
    packageName: '@devtrack-solution/swagger-adapter',
    version: '0.1.0',
    integrity: 'sha512-PENDING-PUBLISH',
  },
  provides: descriptorFile.provides,
  requires: descriptorFile.requires,
};

/** Bloco de montagem lido pelo gerador da Foundation (D7). */
export const swaggerAdapterComposition = descriptorFile.composition;
