"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-5)",
  "var(--chart-4)",
]

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--foreground)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
}
// Force tooltip text to the theme foreground (recharts otherwise colors items dark).
const tooltipItemStyle = { color: "var(--foreground)" }

const axisProps = {
  stroke: "var(--muted-foreground)",
  tick: { fontSize: 11, fill: "var(--muted-foreground)" },
  tickLine: false,
}

function truncateLabel(label: string, max = 16): string {
  if (typeof label !== "string") return String(label)
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
}

export function TrendAreaChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(d: string) => (typeof d === "string" ? d.slice(5) : d)} {...axisProps} />
        <YAxis allowDecimals={false} width={36} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipItemStyle} cursor={{ stroke: "var(--chart-1)", strokeOpacity: 0.2 }} />
        <Area type="monotone" dataKey="count" name="Reports" stroke="var(--chart-1)" strokeWidth={2} fill="url(#trendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function BarBreakdown({
  data,
  height = 300,
}: {
  data: Array<{ name: string; count: number }>
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 28 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="name"
          interval={0}
          height={84}
          angle={-35}
          textAnchor="end"
          tickFormatter={(v: string) => truncateLabel(v)}
          {...axisProps}
        />
        <YAxis allowDecimals={false} width={36} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipItemStyle} cursor={{ fill: "var(--accent)" }} />
        <Bar dataKey="count" name="Reports" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function HorizontalBars({ data }: { data: Array<{ name: string; count: number }> }) {
  const height = Math.max(160, data.length * 40 + 24)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" allowDecimals={false} {...axisProps} />
        <YAxis type="category" dataKey="name" width={140} tickFormatter={(v: string) => truncateLabel(v, 18)} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipItemStyle} cursor={{ fill: "var(--accent)" }} />
        <Bar dataKey="count" name="Reports" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DistributionPie({ data }: { data: Array<{ name: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipItemStyle} />
        <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={92} paddingAngle={2} stroke="var(--card)">
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}
