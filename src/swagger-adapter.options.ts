/**
 * Configuração do adapter de documentação. Título e versão são dados do ambiente
 * e vêm do host (token de configuração); o perfil de composição só seleciona o módulo.
 */
export interface SwaggerAdapterOptions {
  readonly title: string;
  readonly version: string;
  /** Caminho da UI; o OpenAPI JSON fica em `${path}-json`. Padrão: `/docs`. */
  readonly path?: string;
}

export interface ResolvedSwaggerAdapterOptions {
  readonly title: string;
  readonly version: string;
  readonly path: string;
}

export const SWAGGER_ADAPTER_DEFAULT_PATH = '/docs';
const MAX_TEXT_LENGTH = 200;
const PATH_PATTERN =
  /^\/[A-Za-z0-9][A-Za-z0-9._~-]*(?:\/[A-Za-z0-9][A-Za-z0-9._~-]*)*$/;

/** Erro de configuração. A mensagem cita só o campo afetado. */
export class SwaggerAdapterConfigError extends Error {
  constructor(field: string) {
    super(`Invalid Swagger adapter configuration: ${field}`);
    this.name = 'SwaggerAdapterConfigError';
  }
}

function text(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= MAX_TEXT_LENGTH
  );
}

export function resolveSwaggerAdapterOptions(
  options: SwaggerAdapterOptions,
): ResolvedSwaggerAdapterOptions {
  if (typeof options !== 'object' || options === null)
    throw new SwaggerAdapterConfigError('options');
  if (!text(options.title)) throw new SwaggerAdapterConfigError('title');
  if (!text(options.version)) throw new SwaggerAdapterConfigError('version');
  const path = options.path ?? SWAGGER_ADAPTER_DEFAULT_PATH;
  if (typeof path !== 'string' || !PATH_PATTERN.test(path))
    throw new SwaggerAdapterConfigError('path');
  return { title: options.title, version: options.version, path };
}
