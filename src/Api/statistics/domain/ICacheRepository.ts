export interface ICacheRepository {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl: number): Promise<void>;
    del(...keys: string[]): Promise<void>; 
    keys(pattern: string): Promise<string[]>;
    disconnect(): Promise<void>;
}
