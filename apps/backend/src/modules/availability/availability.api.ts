export interface RawAvailabilityRecord {
  carParkNo: string;
  availableLots: number;
  totalLots: number;
  fetchedAt: Date;
}

interface DataGovCarparkInfo {
  lot_type: string;
  lots_available: string;
  total_lots: string;
}

interface DataGovCarpark {
  carpark_info: DataGovCarparkInfo[];
  carpark_number: string;
  update_datetime: string;
}

export async function fetchCarparkAvailability(): Promise<
  RawAvailabilityRecord[]
> {
  const response = await fetch(
    "https://api.data.gov.sg/v1/transport/carpark-availability",
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch carpark availability: ${response.status}`);
  }

  const data = await response.json();

  const carparks = data.items[0].carpark_data;

  return carparks.map((carpark: DataGovCarpark) => {
    const carInfo = carpark.carpark_info[0];

    if (!carInfo) {
      throw new Error(
        `Missing carpark_info for carpark $(carpark.carpark_number)`,
      );
    }

    return {
      carParkNo: carpark.carpark_number,
      availableLots: Number(carInfo.lots_available),
      totalLots: Number(carInfo.total_lots),
      fetchedAt: new Date(carpark.update_datetime),
    };
  });
}
