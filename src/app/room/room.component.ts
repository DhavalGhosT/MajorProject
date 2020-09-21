import { Component, OnInit } from '@angular/core';
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
  participants: Observable<Participant[]>;

  ngOnInit(): void {
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
}
