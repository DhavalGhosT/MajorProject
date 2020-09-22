import * as faceapi from 'face-api.js';

import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Participant } from '../models/participant';
import { LoginService } from '../services/login.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css'],
})
export class RoomComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private loginService: LoginService,
  ) {}

  private roomId;
  private currUser;
  private mediaoptions;
  private stream;
  @ViewChild('video') video: ElementRef;
  @ViewChild('canvas') canvas: ElementRef;
  participants: Observable<Participant[]>;

  ngOnInit(): void {
    this.mediaoptions = { audio: false,video: true};

    navigator.mediaDevices.getUserMedia(this.mediaoptions)
    .then(( stream )=>{
        this.stream = stream;
    })
    .catch(( err )=>{console.log(err)});

    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('assets/api-model'),
      faceapi.nets.faceLandmark68Net.loadFromUri('assets/api-model'),
      faceapi.nets.faceRecognitionNet.loadFromUri('assets/api-model'),
      faceapi.nets.faceExpressionNet.loadFromUri('assets/api-model')
    ]).then(function (){console.log("Done")})

    this.roomId = this.route.snapshot.paramMap.get('id');
    console.log(this.roomId);
    this.loginService
      .getLoggedInUser()
      .subscribe((user) => (this.currUser = user));
    this.participants = this.afs
      .collection('rooms')
      .doc(this.roomId)
      .collection('users')
      .valueChanges();
  }

  async startVideo(){
    this.video.nativeElement.srcObject = this.stream;

    this.video.nativeElement.addEventListener('play', () => {
      const displaySize = { width: this.video.nativeElement.width, height: this.video.nativeElement.height }
      faceapi.matchDimensions(this.canvas.nativeElement,displaySize)
      console.log(displaySize)
      
      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(this.video.nativeElement,  new faceapi.TinyFaceDetectorOptions())
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        this.canvas.nativeElement.getContext('2d').clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height)
        faceapi.draw.drawDetections(this.canvas.nativeElement, resizedDetections)
        // console.log(detections)
      }, 1000)
    })
  }

  stopVideo(){
    this.video.nativeElement.srcObject = null;
  }
}
