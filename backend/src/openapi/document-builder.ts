import { DocumentBuilder } from '@nestjs/swagger';

export function buildOpenApiDocumentBuilder(): DocumentBuilder {
  return new DocumentBuilder()
    .setTitle('Stickup API')
    .setVersion('0.1.0')
    .addCookieAuth('sid');
}
