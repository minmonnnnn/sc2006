import { useState } from "react";

type AvailabilityFilter = "High" | "Moderate" | "Low";

export interface CarparkFilterValues {
  evChargingOnly: boolean;
  shelteredOnly: boolean;
  maxCost?: number;
  minAvailability?: AvailabilityFilter;
}

interface CarparkFiltersProps {
  onChange: (filters: CarparkFilterValues) => void;
}

export function CarparkFilters({ onChange }: CarparkFiltersProps) {
  const [filters, setFilters] = useState<CarparkFilterValues>({
    evChargingOnly: false,
    shelteredOnly: false,
  });

  function updateFilters(newFilters: CarparkFilterValues) {
    setFilters(newFilters);
    onChange(newFilters);
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        aria-pressed={filters.evChargingOnly}
        onClick={() =>
          updateFilters({
            ...filters,
            evChargingOnly: !filters.evChargingOnly,
          })
        }
        style={{
          padding: "8px 14px",
          borderRadius: "20px",
          border: "1px solid #999",
          backgroundColor: filters.evChargingOnly ? "#ddd" : "white",
          color: "black",
          fontWeight: filters.evChargingOnly ? "bold" : "normal",
        }}
      >
        EV Charging
      </button>

      <button
        type="button"
        aria-pressed={filters.shelteredOnly}
        onClick={() =>
          updateFilters({
            ...filters,
            shelteredOnly: !filters.shelteredOnly,
          })
        }
        style={{
          padding: "8px 14px",
          borderRadius: "20px",
          border: "1px solid #999",
          backgroundColor: filters.shelteredOnly ? "#ddd" : "white",
          color: "black",
          fontWeight: filters.shelteredOnly ? "bold" : "normal",
        }}
      >
        Sheltered
      </button>

      <label>
        Availability{" "}
        <select
          value={filters.minAvailability ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            const nextFilters = { ...filters };

            if (value === "") {
              delete nextFilters.minAvailability;
            } else if (
              value === "Low" ||
              value === "Moderate" ||
              value === "High"
            ) {
              nextFilters.minAvailability = value;
            } else {
              return;
            }

            updateFilters(nextFilters);
          }}
        >
          <option value="">Any</option>
          <option value="Low">Low+</option>
          <option value="Moderate">Moderate+</option>
          <option value="High">High</option>
        </select>
      </label>

      <label>
        Max Cost{" "}
        <input
          type="number"
          min="0"
          step="0.1"
          value={filters.maxCost ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            const nextFilters = { ...filters };

            if (value === "") {
              delete nextFilters.maxCost;
            } else {
              const cost = Number(value);

              if (!Number.isFinite(cost) || cost < 0) {
                return;
              }

              nextFilters.maxCost = cost;
            }

            updateFilters(nextFilters);
          }}
          style={{ width: "80px" }}
        />
      </label>

      <button
        onClick={() =>
          updateFilters({
            evChargingOnly: false,
            shelteredOnly: false,
          })
        }
      >
        Clear Filters
      </button>
    </div>
  );
}
