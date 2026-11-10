import {
  SWAGGER_ADAPTER_DEFAULT_PATH,
  SwaggerAdapterConfigError,
  resolveSwaggerAdapterOptions,
} from './swagger-adapter.options';

function fieldOf(action: () => unknown): string | undefined {
  try {
    action();
  } catch (error) {
    return error instanceof SwaggerAdapterConfigError
      ? error.message.replace('Invalid Swagger adapter configuration: ', '')
      : 'OTHER';
  }
  return undefined;
}

describe('swagger adapter options', () => {
  it('uses /docs by default and keeps host title and version', () => {
    expect(
      resolveSwaggerAdapterOptions({ title: 'Host API', version: '1.2.3' }),
    ).toEqual({
      title: 'Host API',
      version: '1.2.3',
      path: SWAGGER_ADAPTER_DEFAULT_PATH,
    });
  });

  it('accepts a nested configurable path', () => {
    expect(
      resolveSwaggerAdapterOptions({
        title: 't',
        version: 'v',
        path: '/internal/docs',
      }).path,
    ).toBe('/internal/docs');
  });

  it('rejects empty or oversized metadata citing only the field', () => {
    expect(
      fieldOf(() => resolveSwaggerAdapterOptions({ title: ' ', version: '1' })),
    ).toBe('title');
    expect(
      fieldOf(() => resolveSwaggerAdapterOptions({ title: 'a', version: '' })),
    ).toBe('version');
    expect(
      fieldOf(() =>
        resolveSwaggerAdapterOptions({ title: 'a'.repeat(201), version: '1' }),
      ),
    ).toBe('title');
  });

  it('rejects paths that are not a plain absolute route', () => {
    for (const path of ['docs', '/', '/a//b', '/a/../b', '/a?x=1', '/docs/']) {
      expect(
        fieldOf(() =>
          resolveSwaggerAdapterOptions({ title: 't', version: 'v', path }),
        ),
      ).toBe('path');
    }
  });
});
