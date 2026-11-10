import {
  Inject,
  Injectable,
  type INestApplication,
  type OnModuleInit,
  type Type,
} from '@nestjs/common';
import { ApiProperty, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  ApplicationConfig,
  HttpAdapterHost,
  ModulesContainer,
} from '@nestjs/core';
import {
  listDtoSchemas,
  type DtoType,
} from '@devtrack/foundation-api/contracts';
import type { ResolvedSwaggerAdapterOptions } from './swagger-adapter.options';
import { SWAGGER_ADAPTER_OPTIONS } from './swagger-adapter.tokens';

/** DTOs já traduzidos: o decorator de propriedade é aplicado uma única vez por classe. */
const translated = new WeakSet<DtoType>();

/**
 * Traduz o contrato neutro para metadata do @nestjs/swagger. Só roda quando o
 * módulo está selecionado; a biblioteca nunca é importada pelo contrato.
 */
function applyDtoSchemas(): void {
  for (const { type, definition } of listDtoSchemas()) {
    if (translated.has(type)) continue;
    translated.add(type);
    const target = type.prototype as object;
    for (const [name, property] of Object.entries(definition.properties)) {
      ApiProperty({
        type: property.type,
        required: property.required ?? false,
        ...(property.description === undefined
          ? {}
          : { description: property.description }),
        ...(property.minLength === undefined
          ? {}
          : { minLength: property.minLength }),
        ...(property.maxLength === undefined
          ? {}
          : { maxLength: property.maxLength }),
        ...(property.minimum === undefined
          ? {}
          : { minimum: property.minimum }),
        ...(property.maximum === undefined
          ? {}
          : { maximum: property.maximum }),
      })(target, name);
    }
  }
}

type RawAdapter = {
  useStaticAssets(path: string, options: { prefix: string }): void;
};

/**
 * Instalador da documentação. Recebe os tokens internos do Nest no init, antes
 * das rotas de fallback. O SwaggerModule lê a aplicação por `container`, `config`,
 * `getHttpAdapter()` e `useStaticAssets`; o NestApplication só existe depois de
 * criado, então esses pontos são fornecidos a partir dos tokens injetáveis.
 * Coberto por test/swagger-adapter.e2e-spec.ts.
 */
@Injectable()
export class SwaggerDocumentationInstaller implements OnModuleInit {
  constructor(
    @Inject(SWAGGER_ADAPTER_OPTIONS)
    private readonly options: ResolvedSwaggerAdapterOptions,
    @Inject(HttpAdapterHost)
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(ModulesContainer)
    private readonly modules: ModulesContainer,
    @Inject(ApplicationConfig)
    private readonly config: ApplicationConfig,
  ) {}

  onModuleInit(): void {
    applyDtoSchemas();
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const raw = httpAdapter as unknown as RawAdapter;
    const app = {
      container: {
        getModules: () => this.modules,
        isGlobalModule: () => false,
      },
      config: this.config,
      getHttpAdapter: () => httpAdapter,
      useStaticAssets: (path: string, options: { prefix: string }) =>
        raw.useStaticAssets(path, options),
    } as unknown as INestApplication;

    const configuration = new DocumentBuilder()
      .setTitle(this.options.title)
      .setVersion(this.options.version)
      .build();
    const extraModels = listDtoSchemas().map(
      (entry) => entry.type as Type<unknown>,
    );
    const document = SwaggerModule.createDocument(app, configuration, {
      extraModels,
    });
    SwaggerModule.setup(this.options.path, app, document);
  }
}
