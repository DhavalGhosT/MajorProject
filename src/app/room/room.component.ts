import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Participant } from '../models/participant';
import { Room } from '../models/room';
import { LoginService } from '../services/login.service';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css'],
})
export class RoomComponent implements OnInit {
  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private loginService: LoginService
  ) {}

  private intervalID: NodeJS.Timeout;
  private tabIntervalID: NodeJS.Timeout;
  private roomId: string;
  private currUser: any;
  private mediaoptions = { audio: false, video: true };
  private stream: MediaStream;
  public status;
  delay = 1000;
  model: tf.LayersModel;
  predictions: Array<number>;

  outputCount: number = 0;
  outputs: Array<any> = [];
  predMap = {
    0: 'attentive',
    1: 'highly_attentive',
    2: 'least_attentive',
    3: 'less_attentive',
    4: 'not_attentive',
  };
  middleMap = { 0: 1, 1: 0, 2: 3, 3: 2, 4: 4 };
  finalMap = {
    1: 'attentive',
    0: 'highly_attentive',
    3: 'least_attentive',
    2: 'less_attentive',
    4: 'not_attentive',
  };
  output: Array<any>[2] = [0, 0];
  private videoElement: HTMLVideoElement;
  @ViewChild('video') video: ElementRef;
  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('c') c: ElementRef;
  @ViewChild('can') can: ElementRef;
  img: string;
  currPart: Observable<Participant>;
  participants: Observable<Participant[]>;
  roomCollection: AngularFirestoreCollection;
  room: Observable<Room>;

  ngOnInit(): void {
    console.log(this.predMap[0], this.output);
    this.loadAttentionDetectionModel();
    // Video Options

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
    ]).then(function () {
      console.log('Models Loaded');
    });

    this.roomId = this.route.snapshot.paramMap.get('id');
    console.log(this.roomId);
    // this.dataService.user.subscribe((user) => {
    this.loginService.getLoggedInUser().subscribe((user) => {
      this.currUser = user;
      this.roomCollection = this.afs
        .collection('rooms')
        .doc(this.roomId)
        .collection('users')
        .doc(this.currUser.uid)
        .collection('attentionData');

      this.participants = this.afs
        .collection('rooms')
        .doc(this.roomId)
        .collection('users')
        .valueChanges();

      this.currPart = this.afs
        .collection('rooms')
        .doc(this.roomId)
        .collection('users')
        .doc(user.uid)
        .valueChanges();

      this.room = this.afs.collection('rooms').doc(this.roomId).valueChanges();
    });
  }

  async startVideo() {
    console.log('StartVideo: delay = ', this.delay);

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

      this.intervalID = setInterval(async () => {
        console.log(`Start of interval: ${this.outputCount}`);

        if (this.outputCount >= 30) {
          console.log(this.outputs);
          this.evaluateAndSendData();
          this.outputCount = 0;
          this.outputs.length = 0;
        }
        console.log('FOCUS:', document.hasFocus());

        const detections = await faceapi.detectSingleFace(
          this.video.nativeElement,
          new faceapi.TinyFaceDetectorOptions()
        );
        // console.log(this.video.nativeElement);

        // console.log((new faceapi.TinyFaceDetectorOptions()).scoreThreshold,(new faceapi.TinyFaceDetectorOptions()).inputSize)

        // console.log("Face: ",detections.length)

        if (detections == undefined) {
          console.log(detections);
          this.output[0] = 4;
          this.output[1] = 1;
          this.outputs.push([this.output[0], this.output[1]]);
          this.outputCount++;

          if (absence_timer == null) {
            absence_timer = new Date().getSeconds();
          }
          difference = new Date().getSeconds() - absence_timer;
          // console.log("Difference: ", difference)
          if (difference >= 5) {
            // console.log("Absent: ",difference)
            this.status = 'Absent: ' + difference + 's';
          }
          // this.roomCollection.add({
          //   type: 4,
          //   prob: 1.0,
          //   timestamp: Date.now(),
          // });
        } else {
          if (document.hasFocus()) {
            absence_timer = null;
            this.status = 'Present';
            // console.log(detections.box);
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
            // faceapi.draw.drawDetections(
            //   this.canvas.nativeElement,
            //   resizedDetections
            // );

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
            // const image = tf.browser
            //   .fromPixels(imgData)
            //   .mean(2)
            //   .toFloat()
            //   .expandDims(0)
            //   .expandDims(-1);
            // console.log(image);
            this.predict(imgData);
            // this.roomCollection.add({
            //   type: this.output[0],
            //   prob: this.output[1],
            //   timestamp: Date.now(),
            // });
          } else {
            this.output[0] = 4;
            this.output[1] = 1;
            this.outputs.push([this.output[0], this.output[1]]);
            this.outputCount++;
          }
        }
        console.log('Delay- ', this.delay);
      }, this.delay);
    });
    console.log('StartVideo: ended with delay = ', this.delay);
  }

  stopVideo() {
    this.status = '';
    this.video.nativeElement.srcObject = null;
    clearInterval(this.intervalID);
    this.delay = 1000;
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
      // console.log(face);
      const output = this.model.predict(face) as any;
      this.predictions = Array.from(output.dataSync());
      console.log('Pred: ', this.predictions);

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
      this.output[0] = this.middleMap[index];
      this.output[1] = this.predictions[index];
      this.outputs.push([this.output[0], this.output[1]]);
      this.outputCount++;
      console.log(this.output);
    }
  }

  evaluateAndSendData() {
    let currType, currProb: number;
    this.outputs.forEach((val, i) => {
      console.log(val);
      if (i == 0) {
        currType = val[0];
        currProb = val[1];
      } else {
        currType = Math.min(Math.floor((currType + val[0]) / 2), 4);
        if (currProb >= val[1]) (currProb * 1.75 + val[1] * 0.25) / 2;
        else (currProb * 0.25 + val[1] * 1.75) / 2;
      }
    });
    console.log(currType, currProb);
    this.roomCollection.add({
      type: currType,
      prob: currProb,
      timestamp: Date.now(),
    });
  }
}
