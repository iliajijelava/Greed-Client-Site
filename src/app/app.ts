import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './statics/header/header';
import { Footer } from './statics/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}