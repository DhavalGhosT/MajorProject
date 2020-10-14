import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { environment } from 'src/environments/environment';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { RoomsComponent } from './rooms/rooms.component';
import { FormsModule } from '@angular/forms';
import { RoomComponent } from './room/room.component';

@NgModule({
  declarations: [AppComponent, LoginComponent, RoomsComponent, RoomComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp({
      apiKey: 'AIzaSyB1osOb96GAa3hqPBPOjknQ8rVcWPo0ORI',
      authDomain: 'majorproject-8b5da.firebaseapp.com',
      databaseURL: 'https://majorproject-8b5da.firebaseio.com',
      projectId: 'majorproject-8b5da',
      storageBucket: 'majorproject-8b5da.appspot.com',
      messagingSenderId: '426819753096',
      appId: '1:426819753096:web:b2227e6c20f624fd47bb3d',
      measurementId: 'G-16YDMYF7TV',
    }),
    AngularFirestoreModule,
    AngularFireAuthModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
