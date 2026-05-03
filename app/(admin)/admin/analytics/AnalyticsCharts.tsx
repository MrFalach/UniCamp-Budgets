'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280', '#EC4899', '#14B8A6']

interface Props {
  campChartData: Array<{ name: string; אושר: number; 'מקדמה שיטים': number; ממתין: number; נדחה: number }>
  categoryData: Array<{ name: string; value: number }>
  weeklyData: Array<{ week: string; total: number }>
}

export function AnalyticsCharts({ campChartData, categoryData, weeklyData }: Props) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">הוצאות לפי קמפ</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campChartData}>
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="אושר" stackId="a" fill="#10B981" />
              <Bar dataKey="מקדמה שיטים" stackId="a" fill="#0EA5E9" />
              <Bar dataKey="ממתין" stackId="a" fill="#F59E0B" />
              <Bar dataKey="נדחה" stackId="a" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">פירוט לפי קטגוריה</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">הוצאות מאושרות לאורך זמן (מצטבר)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <XAxis dataKey="week" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  )
}
