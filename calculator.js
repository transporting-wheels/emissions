// Combined JavaScript file

// Cars class
class Cars {
    constructor(id, adjustedMass, totalCeuRoad, count) {
        this.id = id;
        this.adjustedMass = adjustedMass;
        this.totalCeuRoad = totalCeuRoad;
        this.count = count;
    }

    static builder(id, carAttributes) {
        let totalCeuRoad = 0;

        for (const car of carAttributes) {
            const baseMass = 1400;
            const baseHeight = 1500;
            const baseLength = 4000;

            const extraMass = Math.max(0, car.mass - baseMass);
            const extraHeight = Math.max(0, car.height - baseHeight);
            const extraLength = Math.max(0, car.length - baseLength);

            let ceuRoad = 10;
            ceuRoad += extraMass / 250;
            ceuRoad += (extraLength / 500) * (extraHeight / 300);

            totalCeuRoad += Math.round(ceuRoad);
        }

        const adjustedMass = totalCeuRoad * 0.18;

        return new Cars(id, adjustedMass, totalCeuRoad, carAttributes.length);
    }
}

// Truck class
class Truck {
    constructor(id, vehicleType, fuelType, wttFactor, ttwFactor, grossVehicleWeight, payloadCapacity, infoSource) {
        this.id = id;
        this.vehicleType = vehicleType;
        this.fuelType = fuelType;
        this.wttFactor = wttFactor;
        this.ttwFactor = ttwFactor;
        this.grossVehicleWeight = grossVehicleWeight;
        this.payloadCapacity = payloadCapacity;
        this.infoSource = infoSource;
    }

    get emptyWeight() {
        return this.grossVehicleWeight - this.payloadCapacity;
    }

    get wtwFactor() {
        return this.wttFactor + this.ttwFactor;
    }
}

// Trucks class
class Trucks {
    static lightDutyVanDiesel(id) {
        return new Truck(id, "Light-duty van (<3.5t)", "Diesel", 50, 180, 3.5, 2, "DEFRA (2023), EEA (2022)");
    }

    static mediumDutyTruckDiesel(id) {
        return new Truck(id, "Medium-duty truck (7.5–16t)", "Diesel", 25, 85, 16, 8, "DEFRA (2023)");
    }

    static heavyDutyTruckDiesel(id) {
        return new Truck(id, "Heavy-duty truck (>16t)", "Diesel", 15, 75, 18, 10, "DEFRA (2023), EEA (2022)");
    }

    static heavyDutyTruckLng(id) {
        return new Truck(id, "Heavy-duty truck (>16t)", "LNG", 35, 45, 18, 10, "EcoTransIT World");
    }

    static articulatedTruckDiesel(id) {
        return new Truck(id, "Articulated truck (40t)", "Diesel", 20, 55, 40, 25, "DEFRA (2023), EcoTransIT World");
    }

    static electricVan(id) {
        return new Truck(id, "Light-duty van (<3.5t)", "Electric", 80, 0, 3.5, 2, "DEFRA (2023), EEA (2022)");
    }

    static electricHeavyTruck(id) {
        return new Truck(id, "Heavy-duty truck (>16t)", "Electric", 50, 0, 18, 10, "DEFRA (2023), EEA (2022)");
    }
}

// Stop class
class Stop {
    constructor(location, loadCars = new Set(), unloadCars = new Set()) {
        this.location = location;
        this.loadCars = loadCars;
        this.unloadCars = unloadCars;
    }
}

// Journey class
class Journey {
    constructor(stops, distances, returnTrip) {
        this._stops = stops;
        this._distances = distances;
        this._returnTrip = returnTrip;
        this.validateJourney();
    }

    get haulType() {
        return this._distances.reduce((sum, distance) => sum + distance, 0) / (this._stops.length-1) >= 50 ? "Long Haul" : "Short Haul"
    }

    get stops() {
        return [...this._stops];
    }

    get distances() {
        return [...this._distances];
    }

    get returnTrip() {
        return this._returnTrip;
    }

    validateJourney() {
        if (this._stops.length < 2) {
            throw new Error("A journey must have at least 2 stops");
        }
        if (this._returnTrip && this._distances.length !== this._stops.length) {
            throw new Error("For a return trip, number of distances must equal number of stops");
        }
        if (!this._returnTrip && this._distances.length !== this._stops.length - 1) {
            throw new Error("For a one-way trip, number of distances must be equal to number of stops minus 1");
        }

        const loadedCars = new Set();
        const unloadedCars = new Set();
        const carLocations = new Map();

        this._stops.forEach((stop, i) => {
            const intersection = new Set([...stop.loadCars].filter(x => stop.unloadCars.has(x)));
            if (intersection.size > 0) {
                throw new Error(`Cars cannot be loaded and unloaded at the same stop: ${stop.location}`);
            }

            stop.loadCars.forEach(car => {
                loadedCars.add(car);
                if (!carLocations.has(car)) {
                    carLocations.set(car, []);
                }
                carLocations.get(car).push(i);
            });

            stop.unloadCars.forEach(car => {
                unloadedCars.add(car);
                if (!carLocations.has(car)) {
                    carLocations.set(car, []);
                }
                carLocations.get(car).push(i);
            });
        });

        if (loadedCars.size !== unloadedCars.size || ![...loadedCars].every(car => unloadedCars.has(car))) {
            throw new Error("All loaded cars must be unloaded");
        }

        carLocations.forEach((locations, car) => {
            if (locations.length !== 2) {
                throw new Error(`Car ${car} must be loaded once and unloaded once`);
            }
            if (locations[0] >= locations[1]) {
                throw new Error(`Car ${car} must be loaded before it is unloaded`);
            }
        });
    }

    totalDistance() {
        return this._distances.reduce((sum, distance) => sum + distance, 0);
    }

    emptyTripFactor() {
        const totalDistance = this.totalDistance();
        let emptyDistance = 0;
        const carsOnBoard = new Set();

        this._stops.forEach((stop, i) => {
            if (carsOnBoard.size === 0 && stop.loadCars.size === 0 && i < this._distances.length) {
                emptyDistance += this._distances[i];
            }
            stop.loadCars.forEach(car => carsOnBoard.add(car));
            stop.unloadCars.forEach(car => carsOnBoard.delete(car));
        });

        if (this._returnTrip && carsOnBoard.size === 0) {
            emptyDistance += this._distances[this._distances.length - 1];
        }

        return emptyDistance / totalDistance;
    }

    static pointToPoint(start, end, cars, distance, returnTrip = false) {
        return new Journey(
            [new Stop(start, cars), new Stop(end, new Set(), cars)],
            returnTrip ? [distance, distance] : [distance],
            returnTrip
        );
    }

    static multiStop(stops, distances, returnTrip = false) {
        return new Journey(stops, distances, returnTrip);
    }
}

// EmissionsCalculator class
class EmissionsCalculator {
    calculateEmissions(truck, journey, cars) {
        const legs = [];
        let carsOnBoard = new Set();

        const calculateLeg = (distance, currentCarsOnBoard) => {
            const legMass = cars
                .filter(car => currentCarsOnBoard.has(car.id))
                .reduce((sum, car) => sum + car.adjustedMass * car.count, 0);

            const legCeu = cars
                .filter(car => currentCarsOnBoard.has(car.id))
                .reduce((sum, car) => sum + car.totalCeuRoad, 0);

            const transportActivity = (legMass * distance) / 1000; // Convert to kg

            const totalEmissionsWtt = truck.wttFactor * transportActivity;
            const totalEmissionsTtw = truck.ttwFactor * transportActivity;
            const totalEmissionsWtw = truck.wtwFactor * transportActivity;

            const carAssignment = {};
            cars.forEach(car => {
                if (currentCarsOnBoard.has(car.id)) {
                    const assignment = car.totalCeuRoad / legCeu;
                    carAssignment[car.id] = {
                        assignment,
                        wttEmissions: assignment * totalEmissionsWtt,
                        ttwEmissions: assignment * totalEmissionsTtw,
                        wtwEmissions: assignment * totalEmissionsWtw,
                        wttEmissionsPerCar: (assignment / car.count) * totalEmissionsWtt,
                        ttwEmissionsPerCar: (assignment / car.count) * totalEmissionsTtw,
                        wtwEmissionsPerCar: (assignment / car.count) * totalEmissionsWtw,
                    };
                } else {
                    carAssignment[car.id] = {
                        assignment: 0,
                        wttEmissions: 0,
                        ttwEmissions: 0,
                        wtwEmissions: 0,
                        wttEmissionsPerCar: 0,
                        ttwEmissionsPerCar: 0,
                        wtwEmissionsPerCar: 0,
                    };
                }
            });

            return {
                cars: Array.from(currentCarsOnBoard),
                distance,
                legMass,
                utilizationRate: legMass / truck.payloadCapacity,
                transportActivity,
                totalEmissionsWtt,
                totalEmissionsTtw,
                totalEmissionsWtw,
                assignment: carAssignment,
            };
        };

        // Forward journey
        for (let i = 0; i < journey.stops.length - 1; i++) {
            journey.stops[i].loadCars.forEach(car => carsOnBoard.add(car));
            journey.stops[i].unloadCars.forEach(car => carsOnBoard.delete(car));
            legs.push(calculateLeg(journey.distances[i], carsOnBoard));
        }

        // Return journey if specified
        if (journey.returnTrip) {
            carsOnBoard.clear(); // Empty the truck for the return trip
            legs.push(calculateLeg(journey.distances[journey.distances.length - 1], carsOnBoard));
        }

        const totalEmissionsWtt = legs.reduce((sum, leg) => sum + leg.totalEmissionsWtt, 0);
        const totalEmissionsTtw = legs.reduce((sum, leg) => sum + leg.totalEmissionsTtw, 0);
        const totalEmissionsWtw = legs.reduce((sum, leg) => sum + leg.totalEmissionsWtw, 0);

        const emissionsPerCar = {};
        cars.forEach(car => {
            emissionsPerCar[car.id] = {
                wttEmissions: legs.reduce((sum, leg) => sum + leg.assignment[car.id].wttEmissions, 0),
                ttwEmissions: legs.reduce((sum, leg) => sum + leg.assignment[car.id].ttwEmissions, 0),
                wtwEmissions: legs.reduce((sum, leg) => sum + leg.assignment[car.id].wtwEmissions, 0),
            };
        });

        return {
            totalEmissionsWtt,
            totalEmissionsTtw,
            totalEmissionsWtw,
            emissionsPerLeg: legs,
            emissionsPerCar,
        };
    }
}