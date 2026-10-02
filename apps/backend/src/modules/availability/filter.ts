export interface CarparkFilterInput {
  carParkNo: string;
  hasEvCharging: boolean;
  parkingCost: number;
  availabilityStatus: "High" | "Moderate" | "Low" | "Unavailable";
  isSheltered: boolean;
}

export interface CarparkFilters {
  evChargingOnly?: boolean;
  maxCost?: number;
  minAvailability?: "High" | "Moderate" | "Low";
  shelteredOnly?: boolean;
}

export function filterCarparks(
  carparks: CarparkFilterInput[],
  filters: CarparkFilters,
): CarparkFilterInput[] {
  const availabilityRank = {
    Unavailable: 0,
    Low: 1,
    Moderate: 2,
    High: 3,
  };

  return carparks.filter((carpark) => {
    if (filters.evChargingOnly && !carpark.hasEvCharging) {
      return false;
    }

    if (
      filters.maxCost !== undefined &&
      carpark.parkingCost > filters.maxCost
    ) {
      return false;
    }

    if (
      filters.minAvailability !== undefined &&
      availabilityRank[carpark.availabilityStatus] <
        availabilityRank[filters.minAvailability]
    ) {
      return false;
    }

    if (filters.shelteredOnly && !carpark.isSheltered) {
      return false;
    }

    return true;
  });
}
