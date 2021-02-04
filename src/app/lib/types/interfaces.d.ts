export interface IJoinResponse {
    serverRoomId?: string;
    participants: IParticipants;
    status?: boolean;
}
export interface IParticipantDetails {
    audio: boolean;
    id: string;
    video: boolean;
    attributes?: object;
}
export interface IParticipants {
    [id: string]: IParticipantDetails;
}
export interface IRecordingResponse {
    status: boolean;
    statusCode: number;
}
