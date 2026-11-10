// Fixture fictícia de extensão de negócio. Usa só o contrato neutro da Foundation:
// não importa @nestjs/swagger nem qualquer biblioteca de documentação.
import { Body, Controller, Post } from '@nestjs/common';
import { defineDtoSchema } from '@devtrack/foundation-api/contracts';

export class CreateFixtureContactDto {
  name!: string;
  nickname?: string;
  score?: number;
}

defineDtoSchema(CreateFixtureContactDto, {
  description: 'Contato de fixture para testes de documentação',
  properties: {
    name: { type: 'string', required: true, maxLength: 120 },
    nickname: { type: 'string', minLength: 1 },
    score: { type: 'number', minimum: 0, maximum: 10 },
  },
});

@Controller('fixture-contacts')
export class FixtureContactsController {
  @Post()
  create(@Body() dto: CreateFixtureContactDto): { id: string; name: string } {
    return { id: 'fixture-1', name: dto.name };
  }
}
