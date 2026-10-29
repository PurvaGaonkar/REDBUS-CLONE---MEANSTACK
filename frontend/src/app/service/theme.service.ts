
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'tedbus-theme';
  private currentTheme: Theme = 'light';

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem(this.storageKey);

      this.currentTheme =
        savedTheme === 'dark' || savedTheme === 'light'
          ? savedTheme
          : 'light';

      this.applyTheme();
    }
  }

  get theme(): Theme {
    return this.currentTheme;
  }

  toggleTheme(): void {
    this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.applyTheme();

    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.storageKey, theme);
      } catch {
        // The theme still works for the current session.
      }
    }
  }

  private applyTheme(): void {
    this.document.documentElement.setAttribute(
      'data-theme',
      this.currentTheme
    );

    this.document.documentElement.style.colorScheme = this.currentTheme;
  }
}
