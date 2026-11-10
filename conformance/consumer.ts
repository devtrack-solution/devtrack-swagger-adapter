// Fixture de consumidor (kit de conformidade, D8): uso da API pública pelo nome do pacote.
import type { DynamicModule } from '@nestjs/common';
import {
  SWAGGER_ADAPTER_DEFAULT_PATH,
  SwaggerAdapterModule,
  swaggerAdapterModuleDescriptor,
  type SwaggerAdapterOptions,
} from '@devtrack/swagger-adapter';

const options: SwaggerAdapterOptions = { title: 'Conformance API', version: '1.0.0' };

export const registration: DynamicModule = SwaggerAdapterModule.register(options);
export const defaultPath: string = SWAGGER_ADAPTER_DEFAULT_PATH;
export const provides: string = swaggerAdapterModuleDescriptor.provides[0].id;
