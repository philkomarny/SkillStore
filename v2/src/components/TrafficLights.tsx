interface TrafficLightsProps {
  size?: number;
}

export default function TrafficLights({ size = 12 }: TrafficLightsProps) {
  const style = { width: size, height: size, borderRadius: "50%" };
  return (
    <div className="flex items-center gap-2">
      <span style={{ ...style, background: "#FF5F57" }} />
      <span style={{ ...style, background: "#FEBC2E" }} />
      <span style={{ ...style, background: "#28C840" }} />
    </div>
  );
}
