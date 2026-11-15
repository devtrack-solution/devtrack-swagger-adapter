// Fixture de implementador (kit de conformidade, D8): o host implementa o contrato de
// configuração assíncrona exportado, e um DTO de negócio se descreve só pelo contrato neutro
// da Foundation, sem importar a biblioteca de documentação.
import { defineDtoSchema } from '@devtrack-solution/foundation-api/contracts';
import type { SwaggerAdapterAsyncOptions } from '@devtrack-solution/swagger-adapter';

export const asyncOptions: SwaggerAdapterAsyncOptions = {
  inject: [],
  useFactory: () => ({ title: 'Conformance API', version: '1.0.0' }),
};

export class ConformanceDto {
  name!: string;
}

defineDtoSchema(ConformanceDto, {
  properties: { name: { type: 'string', required: true, maxLength: 40 } },
});
