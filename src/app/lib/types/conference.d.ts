import { SignallingChannel } from "./signallingChannel";
import { IParticipantDetails, IParticipants, IRecordingResponse } from "./interfaces";
import { EventDispatcher } from "./eventDispatcher";
export declare class Conference extends EventDispatcher {
    private _sc;
    private _mcuUrl;
    private _roomId;
    private _endPointId;
    private _mediaServerClient;
    private _attributes;
    private _participants;
    private _publication;
    constructor(_sc: SignallingChannel, _mcuUrl: string, _roomId: string, _endPointId: string, _participants: IParticipants, _mediaServerClient: any, _attributes: any);
    startListeningToStreams(): void;
    readonly participants: IParticipantDetails[];
    readonly remoteStreams: any;
    publish(stream: MediaStream, videoType?: "camera" | "screen-cast", maxBitrate?: number): Promise<any>;
    subscribe(stream: any, options?: any): Promise<any>;
    startRecording(): Promise<IRecordingResponse>;
    stopRecording(): Promise<IRecordingResponse>;
    private _mediaServerLeave;
    mute(type: "audio" | "video"): Promise<boolean>;
    unMute(type: "audio" | "video"): Promise<boolean>;
    end(): Promise<boolean>;
    leave(): Promise<unknown>;
    private _startListeningToEvents;
}
