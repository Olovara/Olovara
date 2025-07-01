declare module 'ipinfo' {
  interface IPinfoResponse {
    ip: string;
    hostname?: string;
    city?: string;
    region?: string;
    country?: string;
    loc?: string;
    org?: string;
    postal?: string;
    timezone?: string;
    readme?: string;
    anycast?: boolean;
  }

  interface IPinfoFunction {
    (ip: string, callback: (err: any, response: IPinfoResponse) => void, token?: string): void;
    HOSTNAME: string;
    HOSTNAME_SSL: string;
    TOKEN_PREFIX: string;
    IP_REGEX: RegExp;
  }

  const ipinfo: IPinfoFunction;
  export = ipinfo;
} 