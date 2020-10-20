import { Component, OnInit, ViewChild } from '@angular/core';
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
import { sha256 } from 'crypto-hash';

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

  roomName: string;
  roomPass: string;
  currRoomPass: string;
  private currUser: firebase.User;
  private roomsCollection: AngularFirestoreCollection;
  rooms: Observable<Room[]>;
  currRoom: Room;
  @ViewChild('name') nameInput;
  @ViewChild('pass') passInput;
  @ViewChild('create') createBtn;
  ngOnInit(): void {
    console.log(this.nameInput);

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

  async createRoom() {
    console.log('Creating room!');
    if (this.roomName == '' || this.roomPass == '') {
      return;
    }
    this.nameInput.nativeElement.disabled = true;
    this.passInput.nativeElement.disabled = true;
    this.createBtn.nativeElement.disabled = true;
    console.log(this.roomPass);
    const hashedPassword: string = await sha256(this.roomPass);
    console.log(hashedPassword);

    const docId = this.afs.createId();
    const room: Room = {
      id: docId,
      hostName: this.currUser.displayName,
      name: this.roomName,
      timestamp: Date.now(),
      hash: hashedPassword,
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
            attentionType: 4,
            prob: 1.0,
          })
          .then((res) => {
            this.router.navigate(['/room', docId]);
            this.roomName = this.roomPass = '';
            this.nameInput.nativeElement.disabled = false;
            this.passInput.nativeElement.disabled = false;
            this.createBtn.nativeElement.disabled = false;
          });
      });
  }

  async joinRoom(room: Room) {
    console.log('Joining room: ', room);
    if (this.currRoomPass == '') {
      return;
    }
    const hash = await sha256(this.currRoomPass);
    console.log(hash, room.hash, hash == room.hash);

    if (hash != room.hash) {
      this.currRoomPass = '';
      return;
    } else {
      const participant: Participant = {
        name: this.currUser.displayName,
        type: 'participant',
        uid: this.currUser.uid,
        attentionType: 4,
        prob: 1.0,
      };
      this.roomsCollection
        .doc(room.id)
        .collection('users')
        .doc(this.currUser.uid)
        .valueChanges()
        .subscribe((data) => {
          if (data) this.router.navigate(['/room', room.id]);
          else {
            console.log('adding');

            this.roomsCollection
              .doc(room.id)
              .collection('users')
              .doc(this.currUser.uid)
              .set(participant)
              .then((res) => this.router.navigate(['/room', room.id]));
          }
        });
    }
  }

  tryJoin(event, room: Room) {
    console.log('Trying to join! ', room);
    this.currRoom = room;
  }
}
