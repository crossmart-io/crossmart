import { writeFile } from 'node:fs/promises';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import {
  API_KEY_HEADER,
  OPENAPI_DESCRIPTION,
  OPENAPI_DOCS_PATH,
  OPENAPI_OUTPUT_FILE,
  OPENAPI_TITLE,
  OpenApiSecurityScheme,
} from '@crossmart/common';

const JSON_INDENTATION = 2;
/** Better Auth's default session cookie. */
const SESSION_COOKIE_NAME = 'better-auth.session_token';

export function buildOpenApiDocument(app: INestApplication, version: string): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle(OPENAPI_TITLE)
    .setDescription(OPENAPI_DESCRIPTION)
    .setVersion(version)
    .setLicense('AGPL-3.0', 'https://www.gnu.org/licenses/agpl-3.0.html')
    .addApiKey({ type: 'apiKey', in: 'header', name: API_KEY_HEADER }, OpenApiSecurityScheme.ApiKey)
    .addCookieAuth(SESSION_COOKIE_NAME, undefined, OpenApiSecurityScheme.SessionCookie)
    // Either scheme authenticates a request, so clients and "Try it out" send the API key.
    .addSecurityRequirements(OpenApiSecurityScheme.ApiKey)
    .addSecurityRequirements(OpenApiSecurityScheme.SessionCookie)
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function serveOpenApiDocs(app: INestApplication, document: OpenAPIObject): void {
  SwaggerModule.setup(OPENAPI_DOCS_PATH, app, document);
}

/** Writes the spec consumed by crossmart-web to generate its typed API client. */
export async function writeOpenApiDocument(document: OpenAPIObject): Promise<void> {
  const serialized = JSON.stringify(document, null, JSON_INDENTATION);
  await writeFile(OPENAPI_OUTPUT_FILE, `${serialized}\n`);
}
