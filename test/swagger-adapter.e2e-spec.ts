import fs from 'node:fs';
import path from 'node:path';
import {
  Controller,
  Get,
  Global,
  Module,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { SwaggerAdapterModule } from '../src';
import {
  CreateFixtureContactDto,
  FixtureContactsController,
} from './fixtures/fixture-contacts';

const HOST_OPTIONS = { title: 'Foundation Test API', version: '9.9.9' };
const FIXTURE_FILE = path.join(__dirname, 'fixtures', 'fixture-contacts.ts');

/** Token de host com o mesmo símbolo que o gerador da Foundation usa para `swagger.options`. */
const SWAGGER_OPTIONS = Symbol.for('foundation.api.v1.host.swagger.options');

describe('swagger adapter module', () => {
  let app: INestApplication<App> | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  /** Módulo de host global com as opções no token, como faz o host da composição gerada. */
  function hostModule(options: unknown) {
    @Global()
    @Module({
      providers: [{ provide: SWAGGER_OPTIONS, useValue: options }],
      exports: [SWAGGER_OPTIONS],
    })
    class HostModule {}
    return HostModule;
  }

  @Controller()
  class ProbeController {
    @Get('probe')
    probe(): { ok: boolean } {
      return { ok: true };
    }
  }

  /** Com `options`, registra o adapter como o gerador faz (`registerAsync` pelo token de host). */
  async function boot(options?: unknown) {
    const documentation =
      options === undefined
        ? []
        : [
            SwaggerAdapterModule.registerAsync({
              inject: [SWAGGER_OPTIONS],
              useFactory: (value: unknown) => value as typeof HOST_OPTIONS,
            }),
          ];
    @Module({
      imports: documentation,
      controllers: [ProbeController, FixtureContactsController],
    })
    class ProbeModule {}
    const moduleRef = await Test.createTestingModule({
      imports: [hostModule(options), ProbeModule],
    }).compile();
    const instance = moduleRef.createNestApplication<INestApplication<App>>();
    await instance.init();
    return instance;
  }

  it('selected: serves the OpenAPI document with the neutral DTO schema', async () => {
    app = await boot(HOST_OPTIONS);
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const doc = response.body as {
      info: { title: string; version: string };
      paths: Record<
        string,
        {
          post?: {
            requestBody?: { content: Record<string, { schema: unknown }> };
          };
        }
      >;
      components: {
        schemas: Record<
          string,
          {
            required?: string[];
            properties: Record<string, Record<string, unknown>>;
          }
        >;
      };
    };
    expect(doc.info).toMatchObject({
      title: HOST_OPTIONS.title,
      version: HOST_OPTIONS.version,
    });
    const schema = doc.components.schemas[CreateFixtureContactDto.name];
    expect(schema.required).toEqual(['name']);
    expect(schema.properties.name).toMatchObject({
      type: 'string',
      maxLength: 120,
    });
    expect(schema.properties.nickname).toMatchObject({
      type: 'string',
      minLength: 1,
    });
    expect(schema.properties.score).toMatchObject({
      type: 'number',
      minimum: 0,
      maximum: 10,
    });
    expect(
      doc.paths['/fixture-contacts'].post?.requestBody?.content[
        'application/json'
      ].schema,
    ).toEqual({
      $ref: `#/components/schemas/${CreateFixtureContactDto.name}`,
    });
  });

  it('selected: serves the documentation UI on the configured path', async () => {
    app = await boot(HOST_OPTIONS);
    await request(app.getHttpServer())
      .get('/docs')
      .expect(200)
      .expect('content-type', /html/);
  });

  it('selected: keeps the same DTO working in the request path', async () => {
    app = await boot(HOST_OPTIONS);
    await request(app.getHttpServer())
      .post('/fixture-contacts')
      .send({ name: 'Ana' })
      .expect(201)
      .expect({ id: 'fixture-1', name: 'Ana' });
  });

  it('not selected: exposes neither /docs nor /docs-json', async () => {
    app = await boot();
    await request(app.getHttpServer()).get('/docs').expect(404);
    await request(app.getHttpServer()).get('/docs-json').expect(404);
  });

  it('not selected: the same DTO keeps working without any documentation', async () => {
    app = await boot();
    await request(app.getHttpServer())
      .post('/fixture-contacts')
      .send({ name: 'Ana' })
      .expect(201);
  });

  it('the fixture extension does not import the documentation library', () => {
    const source = fs.readFileSync(FIXTURE_FILE, 'utf8');
    expect(source).not.toMatch(/from ['"][^'"]*swagger/i);
  });
});
