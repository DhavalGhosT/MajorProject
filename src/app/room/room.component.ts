// import * as faceapi from 'face-api.js';

import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Participant } from '../models/participant';
import { LoginService } from '../services/login.service';
// import { canvas, faceDetectionNet, faceDetectionOptions, saveFile } from './commons';

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
  @ViewChild('video') video: ElementRef;
  participants: Observable<Participant[]>;

  ngOnInit(): void {
    this.mediaoptions = { audio: false,video: true};

    navigator.mediaDevices.getUserMedia(this.mediaoptions)
    .then(( stream )=>{
        this.stream = stream;
    })
    .catch(( err )=>{console.log(err)});
    // Promise.all([
    //   faceapi.nets.tinyFaceDetector.load('/api-model'),
    //   // faceapi.nets.faceLandmark68Net.loadFromDisk('/api-model'),
    //   // faceapi.nets.faceRecognitionNet.loadFromDisk('/api-model'),
    //   // faceapi.nets.faceExpressionNet.loadFromDisk('/api-model')
    // ])

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

  startVideo(){
    this.video.nativeElement.srcObject = this.stream;
  }

  stopVideo(){
    this.video.nativeElement.srcObject = null;
  }
}
