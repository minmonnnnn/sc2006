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

      <div
        style={{
          width: "200px",
          height: "10px",
          backgroundColor: "#ddd",
          borderRadius: "5px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: "#666",
          }}
        />
      </div>

      {isStale && <small>Availability data may be outdated</small>}
    </div>
  );
}
