import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, ChangeDetectionStrategy } from "@angular/core";

@Component({
    selector: "participant-video",
    templateUrl: "./video.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoComponent implements OnChanges {
    @Input() stream: MediaStream;
    @Input() muted: boolean = false;
    @ViewChild("participantVideo", { static: true }) participantVideo: ElementRef;

    constructor(){

    }

    ngOnChanges(changes: SimpleChanges){
        if (changes.stream && changes.stream.currentValue != changes.stream.previousValue) {
            this.participantVideo.nativeElement.srcObject = this.stream;
        }
    }
}