import type { InjectionToken } from '@nestjs/common';

/** Interno: configuração resolvida do adapter Swagger. */
export const SWAGGER_ADAPTER_OPTIONS: InjectionToken = Symbol.for(
  'foundation.api.v1.native.swagger-adapter.options',
);
