export function to<T, U = Error>(promise: Promise<T>): Promise<[T | undefined, U | null]> {
    return promise.then<any>((res: T) => {
        return [null, res];
    }).catch((err: U) => {
        return [err, undefined];
    });
}

export function makeRequest(url: string, method: "GET"|"POST", body: any, headers: object = {}): Promise<any|Error> {
    return new Promise<any>(
        (resolve, reject) => {
            const request = new XMLHttpRequest();
            request.onload = function () {
                if (this.status === 200) {
                    resolve(this.response);
                } else {
                    reject(new Error(this.statusText));
                }
            };
            request.onerror = function () {
                reject(new Error('XMLHttpRequest Error: ' + this.statusText));
            };
            request.open(method, url);
            request.setRequestHeader('Content-Type', 'application/json');
            Object.keys(headers).forEach((key: string) => {
                request.setRequestHeader(key, headers[key]);
            });

            if (body !== undefined) {
                request.send(JSON.stringify(body));
            } else {
                request.send();
            }
        }
    );
}

export function fetchScreenShareStream(): Promise<MediaStream> {
    let displayMediaOptions = {
        video: {
            cursor: "never",
            frameRate: 18
        },
        audio: false
    };

    if (navigator.mediaDevices['getDisplayMedia']) {
        return navigator.mediaDevices['getDisplayMedia'](displayMediaOptions);
    }
    else if (navigator['getDisplayMedia']) {
        return navigator['getDisplayMedia'](displayMediaOptions as MediaStreamConstraints);
    } else {
        return Promise.reject("current browser is not supported for screen sharing. Use latest Chrome/Firefox/Edge");
    }
}

export function fetchAudioStream(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({ video: false, audio: true });
}

export function getMediaStream(config: MediaStreamConstraints = { audio: true,  video: { facingMode: "user" } }): Promise < MediaStream > {
    let streamConstraints: Array < MediaStreamConstraints > = [{
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },
        video: {
            width: 480,
            height: 360,
            frameRate: 15,
            facingMode: "user" 
        }
    }, {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },
        video: {
            width: 640,
            height: 480,
            frameRate: 15,
            facingMode: "user" 
        }
    }, {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },
        video: { facingMode: "user" }
    }];

    let _fetchStreamFromDevice = (config: MediaStreamConstraints = { audio: true, video: { facingMode: "user" } }) => {
        return navigator.mediaDevices.getUserMedia(config);
    }
    
    return new Promise(async(resolve, reject) => {
        for(let [index, conf] of streamConstraints.entries()){
            console.log(`# trying for ${conf.video}`);
            let [streamError, stream] = await to<any, any>(_fetchStreamFromDevice(conf));
            if(streamError){
                if(index+1 == 3){
                    reject(streamError);
                    break;
                }
                
            }else{
                console.log(`# captured: ${conf.video}`);
                resolve(stream);
                break;
            }
        }
    });
}