interface AvailabilityBadgeProps {
  availableLots: number;
  totalLots: number;
  status: "High" | "Moderate" | "Low" | "Unavailable";
  isStale: boolean;
}

export function AvailabilityBadge({
  availableLots,
  totalLots,
  status,
  isStale,
}: AvailabilityBadgeProps) {
  const percentage =
    totalLots > 0 ? Math.round((availableLots / totalLots) * 100) : 0;

  return (
    <div>
      <strong>{status}</strong>

      <div>
        {availableLots} / {totalLots} lots available
      </div>

      <progress
        aria-label="Available parking spaces"
        max={100}
        value={percentage}
      />

      {isStale && <small>Availability data may be outdated</small>}
    </div>
  );
}
