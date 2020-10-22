import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private userSource = new BehaviorSubject<firebase.User>(null);
  user = this.userSource.asObservable();
  constructor() {}

  changeUser(user: firebase.User) {
    this.userSource.next(user);
  }
}
