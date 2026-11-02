import type { NewProductBody } from './product-factory.js';
import type { StockAdjustmentBody } from './stock-history.js';

const API_PREFIX = '/api/v1';
const SIGN_UP_PATH = '/api/auth/sign-up/email';
const SIGN_IN_PATH = '/api/auth/sign-in/email';
const IMAGE_FILE_FIELD = 'file';
const PNG_CONTENT_TYPE = 'image/png';

export interface DemoAccount {
  name: string;
  email: string;
  password: string;
}

interface Workspace {
  id: string;
  name: string;
}

/** The fields of an inventory row the seed needs. */
export interface InventoryRow {
  inventoryItemId: string;
  tracked: boolean;
  onHand: number;
}

interface InventoryPage {
  items: InventoryRow[];
  nextCursor: string | null;
}

const INVENTORY_PAGE_LIMIT = 100;

/** Talks to a running Crossmart API as a signed-in user, the way the web app does. */
export class DemoApiClient {
  private cookie = '';

  constructor(private readonly baseUrl: string) {}

  /** Signs up the demo account, or signs in when it already exists. */
  async signIn(account: DemoAccount): Promise<void> {
    const signUp = await this.post(SIGN_UP_PATH, account);
    const response = signUp.ok
      ? signUp
      : await this.post(SIGN_IN_PATH, { email: account.email, password: account.password });
    if (!response.ok) throw new Error(`Could not sign in as ${account.email}: ${response.status}`);
    this.cookie = response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(';')[0])
      .join('; ');
  }

  async firstWorkspace(): Promise<Workspace> {
    const me = await this.getJson<{ workspaces: Workspace[] }>(`${API_PREFIX}/me`);
    const workspace = me.workspaces[0];
    if (!workspace) throw new Error('The demo account has no workspace');
    return workspace;
  }

  async productCount(workspaceId: string): Promise<number> {
    const stats = await this.getJson<{ products: number }>(
      `${API_PREFIX}/workspaces/${workspaceId}/catalog-stats`,
    );
    return stats.products;
  }

  /** Uploads through the same endpoint and checks as the editor, and returns the public URL. */
  async uploadImage(workspaceId: string, png: Buffer, fileName: string): Promise<string> {
    const form = new FormData();
    form.append(
      IMAGE_FILE_FIELD,
      new Blob([new Uint8Array(png)], { type: PNG_CONTENT_TYPE }),
      fileName,
    );
    const response = await fetch(
      `${this.baseUrl}${API_PREFIX}/workspaces/${workspaceId}/media/product-images`,
      { method: 'POST', headers: { cookie: this.cookie }, body: form },
    );
    const body = (await this.readJson(response)) as { url: string };
    return body.url;
  }

  async createProduct(workspaceId: string, product: NewProductBody): Promise<void> {
    await this.postJson(`${API_PREFIX}/workspaces/${workspaceId}/products`, product);
  }

  /** Every inventory row of the workspace, following the cursor across pages. */
  async inventoryRows(workspaceId: string): Promise<InventoryRow[]> {
    const rows: InventoryRow[] = [];
    let cursor: string | null = null;
    do {
      const query = new URLSearchParams({ limit: String(INVENTORY_PAGE_LIMIT) });
      if (cursor) query.set('cursor', cursor);
      const page: InventoryPage = await this.getJson<InventoryPage>(
        `${API_PREFIX}/workspaces/${workspaceId}/inventory-items?${query.toString()}`,
      );
      rows.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor);
    return rows;
  }

  async adjustStock(
    workspaceId: string,
    inventoryItemId: string,
    adjustment: StockAdjustmentBody,
  ): Promise<void> {
    await this.postJson(
      `${API_PREFIX}/workspaces/${workspaceId}/inventory-items/${inventoryItemId}/adjustments`,
      adjustment,
    );
  }

  private post(path: string, body: unknown): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: this.baseUrl },
      body: JSON.stringify(body),
    });
  }

  private async postJson(path: string, body: unknown): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { cookie: this.cookie, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return this.readJson(response);
  }

  private async getJson<Body>(path: string): Promise<Body> {
    const response = await fetch(`${this.baseUrl}${path}`, { headers: { cookie: this.cookie } });
    return (await this.readJson(response)) as Body;
  }

  private async readJson(response: Response): Promise<unknown> {
    const body: unknown = await response.json();
    if (!response.ok)
      throw new Error(`${response.url} answered ${response.status}: ${JSON.stringify(body)}`);
    return body;
  }
}
