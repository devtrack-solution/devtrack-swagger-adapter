'use strict';
// Boot de conformidade (D8): sobe uma aplicação Nest com o módulo, confere que /docs-json
// responde com o título configurado e encerra. Sai com 0 só se o ciclo completo funcionar.
require('reflect-metadata');
const http = require('node:http');
const { Module } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { SwaggerAdapterModule } = require('@devtrack/swagger-adapter');

function get(port, path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path }, (response) => {
      let body = '';
      response.on('data', (chunk) => (body += chunk));
      response.on('end', () => resolve({ status: response.statusCode, body }));
    }).on('error', reject);
  });
}

async function main() {
  class BootModule {}
  Module({ imports: [SwaggerAdapterModule.register({ title: 'Conformance API', version: '1.0.0' })] })(BootModule);
  const app = await NestFactory.create(BootModule, { logger: false });
  await app.listen(0, '127.0.0.1');
  const { port } = app.getHttpServer().address();
  const docs = await get(port, '/docs-json');
  await app.close();
  if (docs.status !== 200 || JSON.parse(docs.body).info.title !== 'Conformance API') process.exit(1);
}

main().then(() => process.exit(0), () => process.exit(1));
