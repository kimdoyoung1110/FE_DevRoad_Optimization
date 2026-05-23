"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export type ChartPeriod = 'weekly' | 'monthly' | 7 | 30 | 90 | 365;

export interface TrendChartDataItem {
  date: string;
  job_mention_count: number;
  job_change_rate: number;
  article_mention_count: number;
  article_change_rate: number;
}

interface TrendChartProps {
  color: string;
  data: TrendChartDataItem[];
  period: ChartPeriod;
  onPeriodChange: (p: ChartPeriod) => void;
  isLoading?: boolean;
}

function formatDateLabel(ref: string, period: ChartPeriod): string {
  if (!ref || ref.length < 10) return ref;
  const [y, m, d] = ref.split('-');
  if (period === 'monthly' || period === 90 || period === 365) return `${y}.${m}.${d}`;
  return `${m}.${d}`;
}

export default function TrendChart({ color, data, period, onPeriodChange, isLoading }: TrendChartProps) {
  
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: formatDateLabel(d.date, period),
    job_change_rate: Math.max(0, Math.min(d.job_change_rate ?? 0, 100)),
    article_change_rate: Math.max(0, Math.min(d.article_change_rate ?? 0, 100)),
  }));

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload?: { date: string; dateLabel: string; job_change_rate: number; article_change_rate: number; job_mention_count: number; article_mention_count: number }; dataKey?: string; value?: number; color?: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    const lbl = row?.dateLabel ?? label ?? row?.date ?? '';
    const jobRate = row?.job_change_rate ?? 0;
    const articleRate = row?.article_change_rate ?? 0;
    const jobCount = row?.job_mention_count ?? 0;
    const articleCount = row?.article_mention_count ?? 0;
    
    const formatRate = (rate: number) => {
      return `${rate.toFixed(2)}%`;
    };
    
    return (
      <div className="bg-[#1A1B1E] border border-white/10 p-3 rounded-xl shadow-xl text-xs">
        <p className="text-gray-400 mb-2">{lbl} 언급량</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-white font-bold">채용 언급: {formatRate(jobRate)} ({jobCount.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-white font-bold">게시글 언급: {formatRate(articleRate)} ({articleCount.toLocaleString()})</span>
          </div>
        </div>
      </div>
    );
  };

  const xAxisInterval = (period === 'weekly' || period === 7) ? 0 : 2;

  const jobRates = chartData
    .map((d) => d.job_change_rate ?? 0)
    .filter((v) => typeof v === 'number' && v >= 0 && v <= 100);
  const articleRates = chartData
    .map((d) => d.article_change_rate ?? 0)
    .filter((v) => typeof v === 'number' && v >= 0 && v <= 100);
  const allRates = [...jobRates, ...articleRates];
  
  const dataMin = allRates.length ? Math.min(...allRates) : 0;
  const dataMax = allRates.length ? Math.min(Math.max(...allRates), 100) : 100;
  const range = dataMax - dataMin || 1;
  const pad = Math.max(range * 0.2, 1);
  const yMin = Math.max(0, dataMin - pad);
  const yMax = Math.min(dataMax + pad, 100);
  const yDomain: [number, number] = [yMin, yMax];

  const calculateTickInterval = (max: number): number => {
    if (max <= 5) return 1;
    if (max <= 10) return 2;
    if (max <= 20) return 4;
    if (max <= 50) return 10;
    return 20;
  };

  const tickInterval = calculateTickInterval(yMax);
  const yTicks: number[] = [];
  for (let t = 0; t <= yMax; t += tickInterval) {
    yTicks.push(t);
  }
  if (yTicks[yTicks.length - 1] < yMax) {
    yTicks.push(yMax);
  }

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col">
      <div className="flex gap-2 mb-2">
        <button
            onClick={() => onPeriodChange(7)} 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              period === 7 || period === 'weekly'
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-white/50 hover:text-white/80'
            }`}
        >
            주간
        </button>
        <button
            onClick={() => onPeriodChange(30)} 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              period === 30 || period === 'monthly'
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-white/50 hover:text-white/80'
            }`}
        >
            월간
        </button>
        <button
            onClick={() => onPeriodChange(365)} 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              period === 365
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-white/50 hover:text-white/80'
            }`}
        >
            연간
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-white/40">로딩 중...</div>
      ) : (
        <div className="flex-1 min-h-[260px] min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
              <XAxis
                dataKey="dateLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                dy={10}
                interval={xAxisInterval}
                padding={{ left: 0, right: 0 }}
                allowDuplicatedCategory={false}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(v) => {
                  if (typeof v !== 'number' || v < 0 || v > 100) return '';
                  return `${Math.round(v)}%`;
                }}
                domain={yDomain}
                ticks={yTicks}
              />
              <Tooltip
                content={<CustomTooltip />}
                isAnimationActive={true} // ✅ [수정] 애니메이션 활성화
                cursor={false}
                allowEscapeViewBox={{ x: false, y: true }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />

              <Line
                name="채용 언급"
                yAxisId="left"
                type="monotone"
                dataKey="job_change_rate"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#25262B', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#3B82F6' }}
                isAnimationActive={true} // ✅ [수정] 애니메이션 활성화
                animationDuration={1500}
                animationEasing="ease-in-out"
              />

              <Line
                name="게시글 언급"
                yAxisId="left"
                type="monotone"
                dataKey="article_change_rate"
                stroke="#EAB308"
                strokeWidth={3}
                dot={{ r: 4, fill: '#25262B', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#EAB308' }}
                isAnimationActive={true} // ✅ [수정] 애니메이션 활성화
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}