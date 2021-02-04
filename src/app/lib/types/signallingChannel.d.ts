export declare class SignallingChannel {
    private _channel;
    constructor(url: string, id: string);
    emit(event: string, ...args: any[]): void;
    on(event: string, fn: Function): void;
    off(event: string, fn?: Function): void;
    close(): void;
}
