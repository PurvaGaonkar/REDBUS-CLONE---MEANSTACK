
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { CustomerService } from '../../service/customer.service';

declare var google: any;

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, AfterViewInit {

  isloggedIn = false;
  selectedLanguage = 'en';

  languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'mr', name: 'मराठी' }
  ];

  constructor(
    private router: Router,
    private customerservice: CustomerService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.isloggedIn = !!sessionStorage.getItem('Loggedinuser');

    // Restore the previously selected language.
    const savedLanguage = localStorage.getItem('tedbus_language');
    const supportedLanguages = ['en', 'hi', 'mr'];

    const language =
      savedLanguage && supportedLanguages.includes(savedLanguage)
        ? savedLanguage
        : 'en';

    this.changeLanguage(language);

    // Initialize Google Sign-In only when the Google script is available.
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.initialize({
        client_id: 'YOUR_EXISTING_GOOGLE_CLIENT_ID',
        callback: (response: any) => this.handlelogin(response)
      });
    }
  }

  ngAfterViewInit(): void {
    this.rendergooglebutton();
  }

  changeLanguage(language: string): void {
    const supportedLanguages = ['en', 'hi', 'mr'];

    if (!supportedLanguages.includes(language)) {
      language = 'en';
    }

    this.selectedLanguage = language;
    localStorage.setItem('tedbus_language', language);

    this.translate.setDefaultLang('en');
    this.translate.use(language);
  }

  private rendergooglebutton(): void {
    const googlebtn = document.getElementById('google-btn');

    if (googlebtn && typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.renderButton(googlebtn, {
        theme: 'outline',
        size: 'medium',
        shape: 'pill',
        width: 150
      });
    }
  }

  private decodetoken(token: string): any {
    return JSON.parse(atob(token.split('.')[1]));
  }

  handlelogin(response: any): void {
    try {
      const payload = this.decodetoken(response.credential);

      this.customerservice.addcustomermongo(payload).subscribe({
        next: (customer) => {
          sessionStorage.setItem('Loggedinuser', JSON.stringify(customer));
          this.isloggedIn = true;
        },
        error: (error) => {
          console.error('Customer sign-in request failed', error);
        }
      });
    } catch (error) {
      console.error('Unable to process Google sign-in response', error);
    }
  }

  handlelogout(): void {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.disableAutoSelect();
    }

    sessionStorage.removeItem('Loggedinuser');
    this.isloggedIn = false;
    window.location.reload();
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
