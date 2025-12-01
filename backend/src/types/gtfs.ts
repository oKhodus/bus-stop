export interface Stop {
    stop_id: string;
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
}

export interface Route {
    route_id: string;
    route_short_name: string;
    route_long_name: string;
}

export interface Trip {
    trip_id: string;
    route_id: string;
    service_id: string;
}

export interface StopTime {
    trip_id: string;
    arrival_time: string;
    departure_time: string;
    stop_id: string;
    stop_sequence: number;
}
