import type { LineString } from 'geojson';
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../environments/environment';

interface SavedRoute {
    name: string;
    origin: string;
    destination: string;
    waypoints: string[];
}

interface RouteOption {
    distance: number;
    duration: number;
    geometry: LineString;
    index: number;
    selected: boolean;
}

interface MapboxRouteResponse {
    routes?: Array<{
        distance: number;
        duration: number;
        geometry: LineString;
    }>;
    message?: string;
    code?: string;
}

@Component({
    selector: 'app-route-planner',
    templateUrl: './route-planner.component.html',
    styleUrls: ['./route-planner.component.css']
})
export class RoutePlannerComponent implements AfterViewInit, OnDestroy {
    origin = 'Pune, Maharashtra, India';
    destination = 'Mumbai, Maharashtra, India';
    waypoints: string[] = [];

    routes: RouteOption[] = [];
    savedRoutes: SavedRoute[] = [];
    selectedRouteIndex = -1;

    sortBy: 'time' | 'distance' = 'time';
    loading = false;
    errorMessage = '';
    lastUpdated = '';

    private map?: mapboxgl.Map;
    private refreshTimer?: ReturnType<typeof setInterval>;
    private markers: mapboxgl.Marker[] = [];
    private readonly token = environment.mapboxToken;

    private readonly sourceId = 'tedbus-routes';
    private readonly layerId = 'tedbus-route-lines';

    ngAfterViewInit(): void {
        const token = this.token?.trim();

        if (
            !token ||
            token.includes('YOUR_PUBLIC_MAPBOX_TOKEN') ||
            token.includes('PASTE_YOUR_PUBLIC_MAPBOX_TOKEN')
        ) {
            this.errorMessage =
                'Add your Mapbox public token in src/environments/environment.ts.';
            return;
        }

        mapboxgl.accessToken = token;

        this.map = new mapboxgl.Map({
            container: 'tedbus-map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [73.8567, 18.5204],
            zoom: 7
        });

        this.map.addControl(new mapboxgl.NavigationControl());

        this.map.on('load', () => {
            this.initializeRouteLayer();
            void this.planRoute();

            // Refresh estimates every two minutes.
            this.refreshTimer = setInterval(() => {
                if (!this.loading) {
                    void this.planRoute();
                }
            }, 120000);
        });

        this.loadSavedRoutes();
    }

    ngOnDestroy(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        this.markers.forEach(marker => marker.remove());
        this.map?.remove();
    }

    addWaypoint(): void {
        this.waypoints.push('');
    }

    removeWaypoint(index: number): void {
        if (index >= 0 && index < this.waypoints.length) {
            this.waypoints.splice(index, 1);
        }
    }

    async planRoute(): Promise<void> {
        if (!this.map || this.loading) {
            return;
        }

        const places = [
            this.origin.trim(),
            ...this.waypoints
                .map(place => place.trim())
                .filter(Boolean),
            this.destination.trim()
        ];

        if (!this.origin.trim() || !this.destination.trim()) {
            this.errorMessage = 'Enter both a starting point and destination.';
            return;
        }

        if (places.length > 25) {
            this.errorMessage = 'A route can contain at most 25 locations.';
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        try {
            const coordinates: [number, number][] = [];

            for (const place of places) {
                coordinates.push(await this.geocode(place));
            }

            const coordinateString = coordinates
                .map(([longitude, latitude]) => `${longitude},${latitude}`)
                .join(';');

            const params = new URLSearchParams({
                alternatives: coordinates.length === 2 ? 'true' : 'false',
                geometries: 'geojson',
                overview: 'full',
                steps: 'false',
                access_token: this.token
            });

            const url =
                `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/` +
                `${coordinateString}?${params.toString()}`;

            const response = await fetch(url);
            const data = await this.readJson<MapboxRouteResponse>(response);

            if (!response.ok || !data.routes?.length) {
                throw new Error(
                    data.message || 'No route found for these locations.'
                );
            }

            this.routes = data.routes.map((route, index) => ({
                distance: route.distance,
                duration: route.duration,
                geometry: route.geometry,
                index,
                selected: false
            }));

            this.sortRoutes();

            // Select the first route according to the current sorting method.
            this.selectedRouteIndex = this.routes[0]?.index ?? -1;
            this.updateRouteSelection();
            this.updateRouteSource();
            this.updateMarkers(coordinates);
            this.fitMapToRoutes(coordinates);
            this.lastUpdated = new Date().toLocaleTimeString();
        } catch (error: unknown) {
            this.errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unable to calculate the route. Please try again.';
        } finally {
            this.loading = false;
        }
    }

    private async readJson<T>(response: Response): Promise<T> {
        try {
            return await response.json() as T;
        } catch {
            throw new Error('The map service returned an invalid response.');
        }
    }

    private async geocode(place: string): Promise<[number, number]> {
        const params = new URLSearchParams({
            limit: '1',
            country: 'IN',
            access_token: this.token
        });

        const url =
            'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
            `${encodeURIComponent(place)}.json?${params.toString()}`;

        const response = await fetch(url);
        const data = await this.readJson<{
            features?: Array<{ center: [number, number] }>;
            message?: string;
        }>(response);

        if (!response.ok || !data.features?.length) {
            throw new Error(
                data.message || `Location not found: ${place}`
            );
        }

        // Mapbox uses [longitude, latitude].
        return data.features[0].center;
    }

    private initializeRouteLayer(): void {
        if (!this.map || this.map.getSource(this.sourceId)) {
            return;
        }

        this.map.addSource(this.sourceId, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });

        this.map.addLayer({
            id: this.layerId,
            type: 'line',
            source: this.sourceId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': [
                    'case',
                    ['get', 'selected'],
                    '#16a34a',
                    '#94a3b8'
                ],
                'line-width': [
                    'case',
                    ['get', 'selected'],
                    6,
                    4
                ],
                'line-opacity': 0.9
            }
        });

        // Register map interactions only once.
        this.map.on('click', this.layerId, event => {
            const index = event.features?.[0]?.properties?.['index'];

            if (index !== undefined && index !== null) {
                this.selectRoute(Number(index));
            }
        });

        this.map.on('mouseenter', this.layerId, () => {
            if (this.map) {
                this.map.getCanvas().style.cursor = 'pointer';
            }
        });

        this.map.on('mouseleave', this.layerId, () => {
            if (this.map) {
                this.map.getCanvas().style.cursor = '';
            }
        });
    }

    private updateRouteSource(): void {
        const source = this.map?.getSource(
            this.sourceId
        ) as mapboxgl.GeoJSONSource | undefined;

        if (!source) {
            return;
        }

        source.setData({
            type: 'FeatureCollection',
            features: this.routes.map(route => ({
                type: 'Feature' as const,
                properties: {
                    index: route.index,
                    selected: route.index === this.selectedRouteIndex
                },
                geometry: route.geometry
            }))
        });
    }

    private updateRouteSelection(): void {
        this.routes.forEach(route => {
            route.selected = route.index === this.selectedRouteIndex;
        });

        this.updateRouteSource();
    }

    
private updateMarkers(coordinates: [number, number][]): void {
  const map = this.map;

  if (!map) {
    return;
  }

  this.markers.forEach(marker => marker.remove());
  this.markers = [];

  coordinates.forEach((coordinate, index) => {
    const isStart = index === 0;
    const isDestination = index === coordinates.length - 1;

    const marker = new mapboxgl.Marker({
      color: isStart
        ? '#16a34a'
        : isDestination
          ? '#dc2626'
          : '#2563eb'
    })
      .setLngLat(coordinate)
      .setPopup(
        new mapboxgl.Popup().setText(
          isStart
            ? 'Start'
            : isDestination
              ? 'Destination'
              : `Stop ${index}`
        )
      )
      .addTo(map);

    this.markers.push(marker);
  });
}


    private fitMapToRoutes(
        coordinates: [number, number][]
    ): void {
        if (!this.map) {
            return;
        }

        const bounds = new mapboxgl.LngLatBounds();

        // Include all route geometry coordinates, not just the locations.
        for (const route of this.routes) {
            for (const point of route.geometry.coordinates) {
                bounds.extend(point as [number, number]);
            }
        }

        // Fallback if the API doesn't return route geometry.
        if (bounds.isEmpty()) {
            coordinates.forEach(point => bounds.extend(point));
        }

        if (!bounds.isEmpty()) {
            this.map.fitBounds(bounds, {
                padding: 60,
                maxZoom: 12,
                duration: 800
            });
        }
    }

    selectRoute(index: number): void {
        const exists = this.routes.some(route => route.index === index);

        if (!exists) {
            return;
        }

        this.selectedRouteIndex = index;
        this.updateRouteSelection();
    }

    setSortBy(value: 'time' | 'distance'): void {
        this.sortBy = value;
        this.sortRoutes();

        // Select the best route for the chosen sort order.
        this.selectedRouteIndex = this.routes[0]?.index ?? -1;
        this.updateRouteSelection();
    }

    private sortRoutes(): void {
        this.routes.sort((a, b) =>
            this.sortBy === 'time'
                ? a.duration - b.duration
                : a.distance - b.distance
        );
    }

    formatDistance(meters: number): string {
        return `${(meters / 1000).toFixed(1)} km`;
    }

    formatDuration(seconds: number): string {
        const totalMinutes = Math.round(seconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return hours > 0
            ? `${hours} hr ${minutes} min`
            : `${minutes} min`;
    }

    saveCurrentRoute(): void {
        if (!this.origin.trim() || !this.destination.trim()) {
            this.errorMessage = 'Enter an origin and destination before saving.';
            return;
        }

        const route: SavedRoute = {
            name: `${this.origin.trim()} → ${this.destination.trim()}`,
            origin: this.origin.trim(),
            destination: this.destination.trim(),
            waypoints: this.waypoints.map(place => place.trim())
        };

        this.savedRoutes = [
            route,
            ...this.savedRoutes.filter(saved => saved.name !== route.name)
        ];

        this.persistSavedRoutes();
    }

    loadSavedRoute(route: SavedRoute): void {
        this.origin = route.origin;
        this.destination = route.destination;
        this.waypoints = [...route.waypoints];

        void this.planRoute();
    }

    deleteSavedRoute(index: number): void {
        if (index < 0 || index >= this.savedRoutes.length) {
            return;
        }

        this.savedRoutes.splice(index, 1);
        this.persistSavedRoutes();
    }

    private loadSavedRoutes(): void {
        try {
            const saved = localStorage.getItem('tedbus_saved_routes');
            const parsed: unknown = JSON.parse(saved || '[]');

            this.savedRoutes = Array.isArray(parsed)
                ? parsed as SavedRoute[]
                : [];
        } catch {
            this.savedRoutes = [];
        }
    }

    private persistSavedRoutes(): void {
        try {
            localStorage.setItem(
                'tedbus_saved_routes',
                JSON.stringify(this.savedRoutes)
            );
        } catch {
            this.errorMessage =
                'Could not save routes in this browser. Check your browser storage settings.';
        }
    }

    openExternalDirections(): void {
        const places = [
            this.origin.trim(),
            ...this.waypoints
                .map(place => place.trim())
                .filter(Boolean),
            this.destination.trim()
        ];

        const url =
            'https://www.google.com/maps/dir/' +
            places.map(place => encodeURIComponent(place)).join('/');

        window.open(url, '_blank', 'noopener,noreferrer');
    }
}
