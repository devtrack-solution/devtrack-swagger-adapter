import { Module } from '@nestjs/common';
import type {
  DynamicModule,
  InjectionToken,
  ModuleMetadata,
} from '@nestjs/common';
import {
  resolveSwaggerAdapterOptions,
  type SwaggerAdapterOptions,
} from './swagger-adapter.options';
import { SwaggerDocumentationInstaller } from './swagger-adapter.installer';
import { SWAGGER_ADAPTER_OPTIONS } from './swagger-adapter.tokens';

export interface SwaggerAdapterAsyncOptions {
  readonly imports?: ModuleMetadata['imports'];
  readonly inject?: readonly InjectionToken[];
  /** Devolve título/versão do host. Configuração inválida impede o boot. */
  readonly useFactory: (
    ...args: unknown[]
  ) => SwaggerAdapterOptions | Promise<SwaggerAdapterOptions>;
}

/**
 * Módulo nativo de documentação OpenAPI. Só entra no grafo quando a composição o
 * seleciona. Expõe `${path}` (UI) e `${path}-json`; sem o módulo, nada é exposto.
 */
@Module({})
export class SwaggerAdapterModule {
  static register(options: SwaggerAdapterOptions): DynamicModule {
    const resolved = resolveSwaggerAdapterOptions(options);
    return {
      module: SwaggerAdapterModule,
      providers: [
        { provide: SWAGGER_ADAPTER_OPTIONS, useValue: resolved },
        SwaggerDocumentationInstaller,
      ],
    };
  }

  static registerAsync(options: SwaggerAdapterAsyncOptions): DynamicModule {
    if (typeof options?.useFactory !== 'function')
      throw new Error('Invalid Swagger adapter registration: useFactory');
    return {
      module: SwaggerAdapterModule,
      imports: options.imports,
      providers: [
        {
          provide: SWAGGER_ADAPTER_OPTIONS,
          inject: [...(options.inject ?? [])],
          useFactory: async (...args: unknown[]) =>
            resolveSwaggerAdapterOptions(await options.useFactory(...args)),
        },
        SwaggerDocumentationInstaller,
      ],
    };
  }
}
