// src/charts/RiskDonut.jsx
import { PieChart, Pie, Cell } from "recharts";

const COLORS = ["#22c55e", "#facc15", "#ef4444"];

export default function RiskDonut({ data }) {
  return (
    <PieChart width={250} height={250}>
      <Pie
        data={data}
        dataKey="value"
        innerRadius={60}
        outerRadius={100}
      >
        {data.map((entry, index) => (
          <Cell key={index} fill={COLORS[index % 3]} />
        ))}
      </Pie>
    </PieChart>
  );
}