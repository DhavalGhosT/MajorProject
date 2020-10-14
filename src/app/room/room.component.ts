import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs'
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
  public status;
  model: tf.LayersModel;
  predictions: any;
  private videoElement: HTMLVideoElement;
  @ViewChild('video') video: ElementRef;
  @ViewChild('canvas') canvas: ElementRef;
  participants: Observable<Participant[]>;

  ngOnInit(): void {
    this.loadAttentionDetectionModel()
    // Video Options
    this.mediaoptions = { audio: false,video: true};

    navigator.mediaDevices.getUserMedia(this.mediaoptions)
    .then(( stream )=>{
        this.stream = stream;
    })
    .catch(( err )=>{console.log(err)});

    //Loading model
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('assets/api-model'),
      faceapi.nets.faceLandmark68Net.loadFromUri('assets/api-model'),
      faceapi.nets.faceRecognitionNet.loadFromUri('assets/api-model'),
      faceapi.nets.faceExpressionNet.loadFromUri('assets/api-model')
    ]).then(function (){console.log("Models Loaded")})

    

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
    var absence_timer = null;
    var difference;

    this.video.nativeElement.addEventListener('play', () => {
      const displaySize = { width: this.video.nativeElement.width, height: this.video.nativeElement.height }
      faceapi.matchDimensions(this.canvas.nativeElement,displaySize)
      // console.log(displaySize)

      setInterval(async () => {
        const detections = await faceapi.detectSingleFace(this.video.nativeElement,  new faceapi.TinyFaceDetectorOptions())
        console.log(this.video.nativeElement);
        
        console.log(detections.box)
        // console.log((new faceapi.TinyFaceDetectorOptions()).scoreThreshold,(new faceapi.TinyFaceDetectorOptions()).inputSize)
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        this.canvas.nativeElement.getContext('2d').clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height)
        faceapi.draw.drawDetections(this.canvas.nativeElement, resizedDetections)
        // console.log("Face: ",detections.length)

        if(detections == undefined){
          if(absence_timer == null){
              absence_timer = new Date().getSeconds()
          }
          difference = (new Date()).getSeconds() - absence_timer
          // console.log("Difference: ", difference)
          if(difference >= 5){
              // console.log("Absent: ",difference)
              this.status = "Absent: "+difference+"s"
          }
        }
        else{
          absence_timer = null
          this.status = "Present"
        }
      }, 300)
    })
  }

  stopVideo(){
    this.status = ""
    this.video.nativeElement.srcObject = null;
  }

  async loadAttentionDetectionModel() {
    console.log('Loading Attention Detection Model');
    
    this.model = await tf.loadLayersModel('/assets/model.json')
    console.log(this.model.summary());
    
  }
}
