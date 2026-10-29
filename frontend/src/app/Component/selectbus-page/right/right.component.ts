
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BusService } from '../../../service/bus.service';
import { Bus } from '../../../model/bus.model';
import { Route } from '../../../model/routes.model';

@Component({
  selector: 'app-right',
  templateUrl: './right.component.html',
  styleUrl: './right.component.css'
})
export class RightComponent implements OnInit {
  matchedbus: Bus[] = [];
  routes: Route | null = null;
  seats: { [key: string]: any[] } = {};

  loading = false;
  errorMessage = '';
  departurevar = '';
  arrival = '';
  date = '';

  constructor(
    private route: ActivatedRoute,
    private busservice: BusService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.departurevar = params['departure'] || '';
      this.arrival = params['arrival'] || '';
      this.date = params['date'] || '';

      if (!this.departurevar || !this.arrival || !this.date) {
        this.matchedbus = [];
        this.errorMessage =
          'Please select your departure city, arrival city and travel date.';
        return;
      }

      this.loadBuses();
    });
  }

  loadBuses(): void {
    this.loading = true;
    this.errorMessage = '';
    this.matchedbus = [];

    this.busservice
      .GETBUSDETAILS(this.departurevar, this.arrival, this.date)
      .subscribe({
        next: (response: any) => {
          this.matchedbus = Array.isArray(response?.matchedBuses)
            ? response.matchedBuses
            : [];

          this.routes = response?.route || null;
          this.seats = response?.busidwithseatobj || {};

          if (this.matchedbus.length === 0) {
            this.errorMessage =
              response?.message ||
              'No buses found for this route and date. Try another date or route.';
          }

          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load bus results:', error);
          this.errorMessage =
            error?.error?.message ||
            'Unable to load buses. Please check your connection and try again.';
          this.loading = false;
        }
      });
  }

  getkeys(): string[] {
    return Object.keys(this.seats);
  }
}
