import { Routes } from '@angular/router';
import { DownloadPage } from './statics/download/download';
import { Main } from './statics/main/main';
import { Error } from './statics/error/error';
import { Events } from './dynamic/events/events';
export const routes: Routes = [
  { path: 'download', component: DownloadPage },
  {path:"main",component:Main},
  {path:"events",component:Events},
  {path:"",redirectTo:"main",pathMatch:"full"},
  {path:"**",component:Error}
];