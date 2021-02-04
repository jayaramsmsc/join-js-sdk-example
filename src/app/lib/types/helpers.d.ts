export declare function to<T, U = Error>(promise: Promise<T>): Promise<[T | undefined, U | null]>;
export declare function makeRequest(url: string, method: "GET" | "POST", body: any): Promise<any | Error>;
