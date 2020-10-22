import { Component, OnInit } from '@angular/core';
import { FirebaseApp } from '@angular/fire';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { LoginService } from '../services/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  constructor(
    private dataService: DataService,
    private loginService: LoginService,
    private router: Router
  ) {}

  currUser: firebase.User;

  ngOnInit(): void {
    this.loginService.getLoggedInUser().subscribe((user) => {
      if (user) {
        this.currUser = user;
        console.log('LoginComponent, ', user.displayName);
        this.dataService.changeUser(user);
        this.router.navigate(['/rooms']);
        console.log(user.displayName);
      } else {
        this.router.navigate(['/login']);
        console.log('Login Required!');
      }
    });
  }

  signIn() {
    this.loginService.login();
  }

  signOut() {
    this.loginService.logout();
  }
}
