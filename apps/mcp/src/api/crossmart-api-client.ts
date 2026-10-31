import { API_HEALTH_PATH } from '../mcp.constants.js';

/**
 * Thin HTTP client over the Crossmart REST API.
 * The MCP server never touches the database directly: every tool goes through the API,
 * so external agents are bound by the same validation, permissions and policies as the web app.
 */
export class CrossmartApiClient {
  constructor(private readonly baseUrl: string) {}

  getHealth(): Promise<unknown> {
    return this.getJson(API_HEALTH_PATH);
  }

  private async getJson(path: string): Promise<unknown> {
    const response = await fetch(new URL(path, this.baseUrl));
    if (!response.ok) {
      throw new Error(`Crossmart API responded ${response.status} for GET ${path}`);
    }
    return response.json();
  }
}
