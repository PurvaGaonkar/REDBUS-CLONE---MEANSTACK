
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RoutePlannerComponent } from './route-planner/route-planner.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';

import {
  TranslateModule,
  TranslateLoader
} from '@ngx-translate/core';

import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NavbarComponent } from './Component/navbar/navbar.component';
import { FooterComponent } from './Component/footer/footer.component';
import { LandingPageComponent } from './Component/landing-page/landing-page.component';
import { DialogComponent } from './Component/landing-page/dialog/dialog.component';

import { SelectbusPageComponent } from './Component/selectbus-page/selectbus-page.component';
import { HeaderComponent } from './Component/selectbus-page/header/header.component';
import { LeftComponent } from './Component/selectbus-page/left/left.component';
import { RightComponent } from './Component/selectbus-page/right/right.component';
import { SortingBarComponent } from './Component/selectbus-page/right/sorting-bar/sorting-bar.component';
import { BusBoxComponent } from './Component/selectbus-page/right/bus-box/bus-box.component';
import { BottomTabComponent } from './Component/selectbus-page/right/bus-book/bottom-tab/bottom-tab.component';
import { ViewSeatsComponent } from './Component/selectbus-page/right/view-seats/view-seats.component';
import { FormDrawerComponent } from './Component/selectbus-page/right/form-drawer/form-drawer.component';
import { SmallSeatsComponent } from './Component/selectbus-page/right/small-seats/small-seats.component';
import { BusBookingFormComponent } from './Component/selectbus-page/right/bus-booking-form/bus-booking-form.component';

import { PaymentPageComponent } from './Component/payment-page/payment-page.component';
import { ProfilePageComponent } from './Component/profile-page/profile-page.component';
import { MyTripComponent } from './Component/profile-page/my-trip/my-trip.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(
    http,
    './assets/i18n/',
    '.json'
  );
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    LandingPageComponent,
    DialogComponent,
    SelectbusPageComponent,
    HeaderComponent,
    LeftComponent,
    RightComponent,
    SortingBarComponent,
    BusBoxComponent,
    BottomTabComponent,
    ViewSeatsComponent,
    FormDrawerComponent,
    SmallSeatsComponent,
    BusBookingFormComponent,
    PaymentPageComponent,
    ProfilePageComponent,
    MyTripComponent,
     RoutePlannerComponent
  ],

  imports: [
    BrowserModule,
     FormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,

    MatMenuModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatTableModule,
    MatIconModule,
    MatSidenavModule,
    MatDividerModule,

    FormsModule,
    HttpClientModule,

   TranslateModule.forRoot({
  defaultLanguage: 'en',
  loader: {
    provide: TranslateLoader,
    useFactory: HttpLoaderFactory,
    deps: [HttpClient]
  }
})
  ],

  providers: [
    provideNativeDateAdapter()
  ],

  bootstrap: [
    AppComponent
  ]
})
export class AppModule {}
