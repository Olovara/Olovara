type TokenCache = { accessToken: string; expiresAtMs: number };

export type USPSClientConfig = {
  baseUrl: string; // https://apis.usps.com or https://apis-tem.usps.com
  clientId: string;
  clientSecret: string;
};

export class USPSClient {
  private cfg: USPSClientConfig;
  private token: TokenCache | null = null;

  constructor(cfg: USPSClientConfig) {
    this.cfg = cfg;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAtMs > now + 30_000) {
      return this.token.accessToken;
    }

    const url = new URL("/oauth2/v3/token", this.cfg.baseUrl).toString();
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`USPS token request failed (${res.status}): ${txt}`);
    }

    const json = (await res.json()) as {
      access_token: string;
      expires_in?: number;
      token_type?: string;
    };

    const expiresInSec = typeof json.expires_in === "number" ? json.expires_in : 3600;
    this.token = {
      accessToken: json.access_token,
      expiresAtMs: now + expiresInSec * 1000,
    };

    return json.access_token;
  }

  async requestJson<T>(path: string, init: Omit<RequestInit, "headers"> & { headers?: Record<string, string> } = {}): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(path, this.cfg.baseUrl).toString();

    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`USPS API failed ${path} (${res.status}): ${txt}`);
    }
    return (await res.json()) as T;
  }
}

