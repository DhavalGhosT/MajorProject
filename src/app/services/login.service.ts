import { Injectable } from '@angular/core';
import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(private af: AngularFireAuth) {}

  login() {
    this.af.signInWithPopup(new auth.GoogleAuthProvider());
  }

  logout() {
    this.af.signOut();
  }

  getLoggedInUser() {
    return this.af.authState;
  }
}
