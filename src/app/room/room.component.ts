import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
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
    private loginService: LoginService
  ) {}

  private roomId;
  private currUser;
  private mediaoptions;
  private stream;
  public status;
  model: tf.LayersModel;
  predictions: Array<number>;
  predMap = {
    0: 'attentive',
    1: 'highly_attentive',
    2: 'least_attentive',
    3: 'less_attentive',
    4: 'not_attentive',
  };
  output: Array<any>[2] = [0, 0];
  private videoElement: HTMLVideoElement;
  @ViewChild('video') video: ElementRef;
  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('c') c: ElementRef;
  @ViewChild('can') can: ElementRef;
  img: string;
  participants: Observable<Participant[]>;

  ngOnInit(): void {
    console.log(this.predMap[0], this.output);

    this.loadAttentionDetectionModel();
    // Video Options
    this.mediaoptions = { audio: false, video: true };

    navigator.mediaDevices
      .getUserMedia(this.mediaoptions)
      .then((stream) => {
        this.stream = stream;
      })
      .catch((err) => {
        console.log(err);
      });

    //Loading model
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('assets/api-model'),
      faceapi.nets.faceLandmark68Net.loadFromUri('assets/api-model'),
      faceapi.nets.faceRecognitionNet.loadFromUri('assets/api-model'),
      faceapi.nets.faceExpressionNet.loadFromUri('assets/api-model'),
    ]).then(function () {
      console.log('Models Loaded');
    });

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

  async startVideo() {
    this.video.nativeElement.srcObject = this.stream;
    var absence_timer = null;
    var difference;

    this.video.nativeElement.addEventListener('play', () => {
      const displaySize = {
        width: this.video.nativeElement.width,
        height: this.video.nativeElement.height,
      };
      faceapi.matchDimensions(this.canvas.nativeElement, displaySize);
      // console.log(displaySize)

      setInterval(async () => {
        const detections = await faceapi.detectSingleFace(
          this.video.nativeElement,
          new faceapi.TinyFaceDetectorOptions()
        );
        console.log(this.video.nativeElement);

        // console.log((new faceapi.TinyFaceDetectorOptions()).scoreThreshold,(new faceapi.TinyFaceDetectorOptions()).inputSize)

        // console.log("Face: ",detections.length)

        if (detections == undefined) {
          if (absence_timer == null) {
            absence_timer = new Date().getSeconds();
          }
          difference = new Date().getSeconds() - absence_timer;
          // console.log("Difference: ", difference)
          if (difference >= 5) {
            // console.log("Absent: ",difference)
            this.status = 'Absent: ' + difference + 's';
          }
        } else {
          absence_timer = null;
          this.status = 'Present';
          console.log(detections.box);
          const box = detections.box;
          this.c.nativeElement.height = box.height;
          this.c.nativeElement.width = box.width;
          const context = this.can.nativeElement.getContext('2d');

          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
          );
          this.canvas.nativeElement
            .getContext('2d')
            .clearRect(
              0,
              0,
              this.canvas.nativeElement.width,
              this.canvas.nativeElement.height
            );
          faceapi.draw.drawDetections(
            this.canvas.nativeElement,
            resizedDetections
          );

          this.c.nativeElement
            .getContext('2d')
            .drawImage(
              this.video.nativeElement,
              box.x,
              box.y,
              box.width,
              box.height,
              0,
              0,
              box.width,
              box.height
            );
          context.drawImage(this.c.nativeElement, 0, 0, 150, 150);

          const imgData = context.getImageData(0, 0, 150, 150);
          const image = tf.browser
            .fromPixels(imgData)
            .mean(2)
            .toFloat()
            .expandDims(0)
            .expandDims(-1);
          console.log(image);
          this.predict(imgData);
        }
      }, 300);
    });
  }

  stopVideo() {
    this.status = '';
    this.video.nativeElement.srcObject = null;
  }

  async loadAttentionDetectionModel() {
    console.log('Loading Attention Detection Model');
    this.model = await tf.loadLayersModel('/assets/model.json');
    console.log(this.model.summary());
  }

  async predict(imageData: ImageData) {
    const pred = await tf.tidy(() => {
      const face = tf.browser
        .fromPixels(imageData)
        .mean(2)
        .toFloat()
        .expandDims(0)
        .expandDims(-1);
      console.log(face);
      const output = this.model.predict(face) as any;
      this.predictions = Array.from(output.dataSync());
      this.indexOfMaxPrediction();
    });
  }

  indexOfMaxPrediction() {
    if (this.predictions) {
      let max = this.predictions[0];
      let index = 0;
      for (let i = 1; i < this.predictions.length; i++) {
        if (this.predictions[i] > max) {
          index = i;
          max = this.predictions[i];
        }
      }
      this.output[0] = this.predMap[index];
      this.output[1] = this.predictions[index];
      console.log(this.output);
    }
  }
}
