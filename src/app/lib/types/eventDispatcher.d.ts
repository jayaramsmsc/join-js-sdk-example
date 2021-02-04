export declare class EventDispatcher {
    private _eventListeners;
    on(eventType: string, listener: Function): void;
    removeEventListener(eventType: string, listener: Function): void;
    protected emit(eventType: string, args: any): void;
}
