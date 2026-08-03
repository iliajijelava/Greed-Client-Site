import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly currentLang = signal<'en' | 'ru'>('en');

  protected toggleLang(): void {
    this.currentLang.set(this.currentLang() === 'en' ? 'ru' : 'en');
  }
}