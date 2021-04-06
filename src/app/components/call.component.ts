import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { fetchScreenShareStream, getMediaStream, makeRequest, fetchAudioStream } from '../helpers';
import * as Telebu from "join-js-sdk";
import { Conference } from 'join-js-sdk/dist/types/conference';
import { IParticipantDetails } from 'join-js-sdk/dist/types/interfaces';

interface IParticipantSummary {
    name?: string, 
    stream?: MediaStream, 
    streamCapabilities?: any;
    audio?: boolean;
    video?: boolean;
    attributes?: object;
    subscription?: any;
}

interface IParticipants {
    [id: string]: IParticipantSummary
}

@Component({
    selector: "video-call",
    templateUrl: "./call.component.html",
    
})
export class CallComponent implements OnInit {
    public participants: IParticipants = {};
    private _conference: any;
    private _publication: any;
    public id: string; 
    public presenting: boolean = false;
    public activeSpeakerName: string;

    constructor(private _route: ActivatedRoute, private _router: Router){
        
    }

    ngOnInit(){
        this._route.paramMap.subscribe(async params => {
            let roomId = params.get("roomId");
            let url = `${environment.apiUrl}/rooms/createToken`;
            let headers = {
                "x-access-key": environment.accessKey,
                "x-access-secret": environment.secretKey
            }
            this.id = (new Date().getTime()).toString(36);
            try {
                let resp = await makeRequest(url, "POST", { accountId: environment.accountId, roomId, endPointId: this.id }, headers);
                let { token } = JSON.parse(resp);
                let name = prompt("Enter your name to start the call");
                if(name === null || name === ""){
                    name = this.id;
                }
                this._startCall(token, this.id, name);
            }catch(err){
                console.error(err);
            }
            
        });
    }

    public startScreenShare(){
        fetchScreenShareStream().then(async (screenShareStream: MediaStream) => {
            let audioStream = await fetchAudioStream();
            audioStream.getAudioTracks().forEach((track) => {
                screenShareStream.addTrack(track);
            });
            this._clearAllStreams();
            this.presenting = true;
            this._publishStream("screen-cast", screenShareStream);
        });
    }

    public stopScreenShare(){
        this._clearAllStreams();
        this.presenting = false;
        getMediaStream().then((stream) => {
            this._publishStream("camera", stream);
        });
    }

    public end(){
        if(this._conference){
            this._clearAllStreams();
            this._conference.end().then((status) => {
                if(status){
                    console.log("call ended successfully");
                    this._router.navigate(["/"]);
                }else{
                    console.error("Something went wrong ");
                }
            }).catch((err) => {
                console.error(err);
            });
        }
    }

    public leave(){
        if(this._conference){
            this._clearAllStreams();
            this._conference.leave().then((status) => {
                console.log("leaveeeeeeeee" )
                if(status){
                    console.log("call left successfully");
                    this._router.navigate(["/"]);
                }else{
                    console.error("Something went wrong ");
                }
            }).catch((err) => {
                console.error(err);
            });
        }
    }

    public mute(type: "audio"| "video"){
        if(this.participants[this.id].stream){
            if(type == "audio"){
                this.participants[this.id].stream.getAudioTracks()[0].enabled = false;
            }else{
                console.log("video")
                this.participants[this.id].stream.getVideoTracks()[0].enabled = false;
            }
        }
        this._conference.mute(type).then((status) => {
            if(status){
                this.participants[this.id][type] = false;
            }
        })
    }

    public unmute(type: "audio"| "video"){
        if(this.participants[this.id].stream){
            if(type == "audio"){
                this.participants[this.id].stream.getAudioTracks()[0].enabled = true;
            }else{
                this.participants[this.id].stream.getVideoTracks()[0].enabled = true;
            }
        }
        this._conference.unMute(type).then((status) => {
            if(status){
                this.participants[this.id][type] = true;
            }
        });
    }

    public startRecording(){
        this._conference.startRecording().then(({ status, statusCode }) => {
            if(status){
                console.log("recording started")
            }else{  
                console.error("recording: ", status, statusCode);
            }
        });
    }

    public stopRecording(){
        this._conference.stopRecording().then(({ status, statusCode }) => {
            if(status){
                console.log("recording stopped")
            }else{  
                console.error("recording: ", status, statusCode);
            }
        });
    }

    private _clearAllStreams(){
        let selfStream = this.participants[this.id].stream
        if(selfStream){
            selfStream.getTracks().forEach((track) => {
                track.stop();
            })
        }
        if(this._publication){
            this._publication.stop();
        }
    }

    private _publishStream(type: "camera"|"screen-cast", stream: MediaStream){
        this._clearAllStreams();
        this.participants[this.id].stream = stream;
        this._conference.publish(stream, type, 400).then((pub) => {
            console.log("successfully published", pub);
            this._publication = pub;
        }).catch((err) => {
            console.error("publication error", err);
        });
    }

    private _startCall(token: string, id: string, name: string){
        Telebu.join( token, id, { id, name }).then((conference: any) => {
            console.log(conference);
            this._conference = conference;
            console.log("Successfully joined");
            conference.participants.forEach((user: IParticipantDetails) => {
                console.log("new partic");
                this.participants[user.id] = {
                    name: user.attributes ? user.attributes["name"] : "",
                    attributes: user.attributes ? user.attributes : {},
                    audio: user.audio,
                    video: user.video
                }
            });

            console.log("before streams");
            conference.remoteStreams.forEach(this._streamAdded.bind(this));

            getMediaStream().then((stream) => {
                this._publishStream("camera", stream);
                // this.participants[this.id].stream = stream;
                // conference.publish(stream, "camera", 400).then((pub) => {
                //     console.log("successfully published", pub);
                //     this._publication = pub;
                // }).catch((err) => {
                //     console.error("publication error", err);
                // });
            });

            conference.on("participantAdded", (data) => {
                console.log("participant added", data);
                if(data){
                    this.participants[data["id"]] = {
                        name: data.attributes ? data.attributes["name"] : "",
                        attributes: data.attributes ? data.attributes : {},
                        audio: data["audio"],
                        video: data["video"]
                    }
                }
            })

            conference.on('activeAudioStreamChanged', (activeStreamId) => {
                const activeStream = this._conference.remoteStreams.find(stream => stream.id == activeStreamId);

                if (activeStream) {
                    this.activeSpeakerName = activeStream.attributes.name;
                }
            })

            conference.on("streamAdded", this._streamAdded.bind(this));

            conference.on("participantDisconnected", (id) => {
                console.log("part dis", id);
                if(id){
                    let participant = this.participants[id];
                    if(participant){
                        if(participant.subscription){
                            participant.subscription.stop();
                        }
                        delete this.participants[id];
                    }
                }
            })

            conference.on("leave", (id) => {
                console.log("part leavee", id);
                if(id){
                    let participant = this.participants[id];
                    if(participant){
                        if(participant.subscription){
                            participant.subscription.stop();
                        }
                        delete this.participants[id];
                    }
                }
            })

            conference.on("serverDisconnected", () => {
                console.log("server disconnected, pls reconnect");
            });

            conference.on("end", () => {
                this._clearAllStreams();
                this._router.navigate(["/"]);
            });

            conference.on("mute", ({ id, roomId, mediaType, value }) => {
                if(id && this.participants[id]){
                    this.participants[id][mediaType] = value;
                }
            });

            conference.on("leave", () => {
                console.log("leave event ====")
            });

        }).catch((err) => {
            console.error(err);
        });
    }

    private _streamAdded(stream: any){
        console.log("stream added");
        if(stream.attributes && stream.attributes["id"] && stream.attributes["id"] != this.id){
            let participant = this.participants[stream.attributes["id"]];
            if(participant){
                participant.streamCapabilities = stream;
                this._subscribe(stream.attributes["id"], stream);
            }
        }
    }

    private _subscribe(id: string, stream: any){
        
        this._conference.subscribe(stream).then((subscription: any) => {
            this.participants[id].subscription = subscription;
            this.participants[id].stream = stream.mediaStream;
        }).catch((err) => {
            console.error("subscription error");
        });
    }
}