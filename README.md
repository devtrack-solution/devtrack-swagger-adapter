# @devtrack-solution/swagger-adapter

Módulo oficial Swagger Adapter da DevTrack Foundation. Gera a documentação OpenAPI a partir do contrato neutro `defineDtoSchema`, exportado por `@devtrack-solution/foundation-api/contracts`, sobre `@nestjs/swagger@11.4.8` (versão exata). Os módulos de negócio descrevem seus DTOs só com o contrato neutro e nunca importam `@nestjs/swagger`.

- Expõe a UI em `${path}` (padrão `/docs`) e o documento em `${path}-json`, somente quando o módulo está instalado e selecionado.
- Título, versão e caminho vêm do host. A configuração é validada: título e versão não vazios, com até 200 caracteres; caminho no formato `/segmento/segmento`.
- Fornece a capacidade `api-documentation` major 1. Só Express é suportado (`platform-express`).

É uma extensão npm: entra na API pelo `api-cli`, nunca por cópia de arquivos.

## Instalação

Pré-requisito: um host com `@devtrack-solution/foundation-api` `^0.1.0`, `@nestjs/common` e `@nestjs/core` `^11`. Com o registry configurado no `.npmrc` (`@devtrack-solution:registry=…`, ver `foundation-api/docs/publishing.md`):

```bash
# api-cli do workspace (bin `api-cli` de ../api-cli); --foundation aponta para o host
api-cli --foundation ./foundation-api install @devtrack-solution/swagger-adapter@0.1.0 --registry "$DEVTRACK_REGISTRY"
```

O `api-cli` valida integridade, versão exata, peers e descriptor, registra `ext/swagger-adapter` no perfil e regenera a composição.

## Configuração

O host fornece as opções pelo token de host `swagger.options`, declarado no bloco `composition` do descriptor. O módulo gerado expõe esse token como `COMPOSITION_HOST_TOKENS.swaggerOptions`, com valor `Symbol.for('foundation.api.v1.host.swagger.options')`:

```ts
import type { SwaggerAdapterOptions } from '@devtrack-solution/swagger-adapter';
import { COMPOSITION_HOST_TOKENS } from './composition/composition.generated';

const swaggerOptions: SwaggerAdapterOptions = { title: 'Minha API', version: '1.0.0' };
// num módulo @Global() do host:
// { provide: COMPOSITION_HOST_TOKENS.swaggerOptions, useValue: swaggerOptions }
```

Sem o token, o boot falha. Uso direto, sem o gerador: `SwaggerAdapterModule.register(options)` ou `registerAsync({ inject, useFactory })`.

## Descriptor

`@devtrack-solution/swagger-adapter/descriptor` (`dist/swagger-adapter.descriptor.json`) contém só metadata:

```json
{
  "id": "ext/swagger-adapter",
  "provides": [{ "id": "api-documentation", "major": 1 }],
  "composition": {
    "hostOptions": { "token": "swagger.options", "type": "SwaggerAdapterOptions" }
  }
}
```

## Desenvolvimento

- No workspace, `scripts/link-foundation.mjs` liga `node_modules/@devtrack-solution/foundation-api` à pasta irmã `../foundation-api`. Fora do workspace, a Foundation vem do registry. O lockfile não grava URL de registry (`.npmrc` com `omit-lockfile-registry-resolved=true`); em qualquer ambiente, `npm ci` precisa de `@devtrack-solution:registry` configurado no `.npmrc` do usuário ou do pipeline (ver `docs/publishing.md` da Foundation).
- `npm run typecheck`, `npm run lint:check`, `npm test` (unitários e e2e com `/docs`, `/docs-json` e o DTO neutro), `npm run test:boundaries`.
- Fronteira: o código só importa `@devtrack-solution/foundation-api/contracts` e `/nest`. O `prepack` roda a verificação de publicação e a de fronteira.
- CI: `azure-pipelines.yml` roda a qualidade do pacote e a conformidade contra a Foundation publicada (checkout do `devtrack-foundation-core` na tag do peer e `npm run conformance:published`). Conformidade `failed` ou `incomplete` bloqueia a publicação, que só acontece em tag `v<versão>`. Variáveis e detalhes: `docs/publishing.md` da Foundation, seção "Pipelines".

## Limites

- O instalador depende de internals do Nest (objeto mínimo com `container`, `config`, `getHttpAdapter()` e `useStaticAssets`), cobertos pelo e2e e pinados pela versão.
- `describeOperation` (resumo e tags de operação) não existe ainda.
- Licença MIT (arquivo `LICENSE`).
