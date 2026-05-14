// src/charts/TrendChart.jsx
import { LineChart, Line, XAxis, YAxis } from "recharts";

export default function TrendChart({ data }) {
  return (
    <LineChart width={300} height={200} data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Line type="monotone" dataKey="risk" stroke="#8884d8" />
    </LineChart>
  );
}