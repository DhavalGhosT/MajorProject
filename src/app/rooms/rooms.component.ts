import { Component, OnInit } from '@angular/core';
import { Room } from '../models/room';
import { LoginService } from '../services/login.service';
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Participant } from '../models/participant';

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
  private currUser: firebase.User;
  private roomsCollection: AngularFirestoreCollection;
  rooms: Observable<Room[]>;

  ngOnInit(): void {
    this.loginService
      .getLoggedInUser()
      .subscribe((user) => (this.currUser = user));
    this.rooms = this.afs.collection('rooms').valueChanges();
    this.roomsCollection = this.afs.collection('rooms');
  }

  signOut() {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }

  createRoom() {
    const docId = this.afs.createId();
    const room: Room = {
      id: docId,
      hostName: this.currUser.displayName,
      name: this.roomName,
      timestamp: Date.now(),
    };
    this.roomsCollection
      .doc(docId)
      .set(room)
      .then((res) => {
        console.log('Data saved!', res);
        this.afs
          .collection('rooms')
          .doc(docId)
          .collection('users')
          .doc(this.currUser.uid)
          .set({
            uid: this.currUser.uid,
            name: this.currUser.displayName,
            type: 'host',
          })
          .then((res) => this.router.navigate(['/room', docId]));
      });
    this.roomName = '';
  }

  joinRoom(roomId: string) {
    const participant: Participant = {
      name: this.currUser.displayName,
      type: 'participant',
      uid: this.currUser.uid,
    };
    this.roomsCollection
      .doc(roomId)
      .collection('users')
      .doc(this.currUser.uid)
      .set(participant);
  }
}
