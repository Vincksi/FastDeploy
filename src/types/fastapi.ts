
export interface Endpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
}

export interface FastAPIConfig {
  name: string;
  description: string;
  port: number;
  endpoints: Endpoint[];
  database: {
    enabled: boolean;
    type: 'sqlite' | 'postgresql';
  };
  middleware: string[];
}
