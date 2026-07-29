import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-main',
  imports: [],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {
  protected readonly slides = Array.from({ length: 6 }, (_, i) => `carousel/slide${i + 1}.png`);
  protected readonly currentIndex = signal(1);
  protected readonly lightboxOpen = signal(false);
  protected readonly lightboxIndex = signal(0);

  protected prev(): void {
    this.currentIndex.update(i => (i === 0 ? this.slides.length - 1 : i - 1));
  }

  protected next(): void {
    this.currentIndex.update(i => (i === this.slides.length - 1 ? 0 : i + 1));
  }

  protected openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  protected closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  protected lightboxPrev(event: Event): void {
    event.stopPropagation();
    this.lightboxIndex.update(i => (i === 0 ? this.slides.length - 1 : i - 1));
  }

  protected lightboxNext(event: Event): void {
    event.stopPropagation();
    this.lightboxIndex.update(i => (i === this.slides.length - 1 ? 0 : i + 1));
  }
}