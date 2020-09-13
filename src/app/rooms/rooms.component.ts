import { Component, OnInit } from '@angular/core';

import { LoginService } from '../services/login.service';
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css'],
})
export class RoomsComponent implements OnInit {
  constructor(
    private loginService: LoginService,
    private afs: AngularFirestore,
    private router: Router
  ) {}

  roomName: String;
  currUser: firebase.User;
  roomsCollection: AngularFirestoreCollection;

  ngOnInit(): void {
    this.loginService
      .getLoggedInUser()
      .subscribe((user) => (this.currUser = user));
  }

  signOut() {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }

  createRoom() {
    this.roomsCollection = this.afs.collection('rooms');
    const docId = this.afs.createId();
    const room: Room = {
      id: docId,
      name: this.roomName,
    };
    this.roomsCollection
      .doc(docId)
      .set(room)
      .then((res) => {
        console.log('Data saved!', res);
        this.afs.collection('rooms').doc(docId).collection('users').add({
          uid: this.currUser.uid,
          name: this.currUser.displayName,
          type: 'host',
        });
      });
    this.roomName = '';
  }
}

interface Room {
  id: String;
  name: String;
}
