import { readMcpConfig } from './config/mcp-config.js';
import { McpTransportKind } from './mcp.constants.js';
import { serveHttp } from './transports/http.transport.js';
import { serveStdio } from './transports/stdio.transport.js';

const config = readMcpConfig();
if (config.transport === McpTransportKind.Http) serveHttp(config);
else await serveStdio(config);
