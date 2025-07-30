import { useState } from "react";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  AreaChart, Area,
  ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";
import clsx from "clsx";

type BackendResponse = {
  goal: "sql" | "chart" | "both" | string;
  sql?: string;
  results?: Record<string, any>[];
  charts_type?: string[];
  charts_data?: Record<string, { name: string; value: number }[]>;
  error?: string;
};

type ChartPanelProps = {
  type: string;
  data: { name: string; value: number }[];
  sql: string;
  results: Record<string, any>[];
  idx: number;
};

function ChartPanel({ type, data, sql, results, idx }: ChartPanelProps) {
  const titles: Record<string, string> = {
    barchart: "Гистограмма",
    linechart: "Линейный график",
    piechart: "Круговая диаграмма",
    areachart: "Площадная диаграмма",
    scatterchart: "Точечный график",
  };
  const title = titles[type] || type;

const cols = Object.keys(results[0] || {});
  const xField = cols[0] ?? "name";
  const yField = cols[0] ?? "value";

  const seriesName = yField;

  const renderInner = () => {
    const common = {
      data,
      margin: { top: 10, right: 10, left: 10, bottom: 10 },
    };
    switch (type) {
      case "barchart":
        return (
          <BarChart {...common}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" label={{ value: xField, position: "insideBottom", dy: 10 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name={seriesName} fill="#4f46e5" />
          </BarChart>
        );
      case "linechart":
        return (
          <LineChart {...common}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" label={{ value: xField, position: "insideBottom", dy: 10 }} />
            <YAxis />
            <Tooltip />
            <Legend />
             <Line type="monotone" dataKey="value" name={seriesName} stroke="#10b981" />
          </LineChart>
        );
      case "piechart":
        return (
          <PieChart {...common}>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label>
              {data.map((_, i) => (
                <Cell key={i} fill={`hsl(${(i * 50) % 360}, 65%, 55%)`} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      case "areachart":
        return (
          <AreaChart {...common}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" label={{ value: xField, position: "insideBottom", dy: 10 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" name={seriesName} stroke="#f97316" fill="#fed7aa" />
          </AreaChart>
        );
      case "scatterchart":
        return (
          <ScatterChart {...common}>
            <CartesianGrid />
            <XAxis dataKey="name" label={{ value: xField, position: "insideBottom", dy: 10 }} />
             <YAxis dataKey="value" label={{ value: seriesName, angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Legend />
            <Scatter name={seriesName} data={data} fill="#ef4444" />
          </ScatterChart>
        );
      default:
        return <p>Неподдерживаемый тип: {type}</p>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 w-full max-w-2xl mx-auto space-y-4">
      <h3 className="text-xl font-semibold text-gray-700">📊 {title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {renderInner()}
        </ResponsiveContainer>
      </div>

      <details className="bg-gray-50 border border-gray-200 rounded p-3">
        <summary className="cursor-pointer font-medium text-gray-700">
          📝 Показать SQL-запрос
        </summary>
        <pre className="mt-2 bg-gray-100 rounded p-2 overflow-auto text-sm text-gray-800">
          <code>{sql}</code>
        </pre>
      </details>

      <details className="bg-gray-50 border border-gray-200 rounded p-3">
        <summary className="cursor-pointer font-medium text-gray-700">
          📋 Показать данные
        </summary>
        <div className="mt-2 overflow-auto max-h-48">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                {Object.keys(results[0]).map((col) => (
                  <th key={col} className="px-2 py-1 text-left text-gray-600">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-2 py-1 text-gray-700">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export default function App() {
  const [inputValue, setInputValue] = useState("");
  const [response, setResponse] = useState<BackendResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("http://localhost:5000/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_prompt: inputValue }),
      });
      const data: BackendResponse = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ goal: "other", error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">BI Мульти-Агент</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white rounded-lg shadow p-6 space-y-4"
      >
        <label className="block text-gray-700 font-medium">Ваш запрос:</label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Например: Покажи выручку по месяцам за 2024"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
        />
        <button
          type="submit"
          disabled={loading}
          className={clsx(
            "w-full py-3 rounded-lg text-white font-semibold transition",
            loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
          )}
        >
          {loading ? "Обработка..." : "Выполнить"}
        </button>
      </form>

      {response?.error && (
        <div className="w-full max-w-xl bg-red-100 border border-red-300 text-red-800 rounded-lg p-4">
          <strong>Ошибка:</strong> {response.error}
        </div>
      )}

      {response && (response.goal === "sql" || response.goal === "both") && response.results && (
        <section className="w-full max-w-2xl space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">📝 SQL‑запрос и таблица</h2>
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <details className="bg-gray-50 border border-gray-200 rounded p-3">
              <summary className="cursor-pointer font-medium text-gray-700">
                📝 Показать SQL-запрос
              </summary>
              <pre className="mt-2 bg-gray-100 rounded p-2 overflow-auto text-sm text-gray-800">
                <code>{response.sql}</code>
              </pre>
            </details>

            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(response.results[0]).map((col) => (
                      <th
                        key={col}
                        className="px-4 py-2 text-left text-gray-600 font-medium"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {response.results.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-4 py-2 text-gray-700">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {response && (response.goal === "chart" || response.goal === "both") && response.charts_type && (
        <section className="w-full max-w-2xl space-y-6">
          <h2 className="text-2xl font-semibold text-gray-700">📈 Графики</h2>
          {response.charts_type.map((type, idx) =>
            response.charts_data ? (
              <ChartPanel
                key={type + idx}
                type={type}
                data={response.charts_data[type]}
                sql={response.sql!}
                results={response.results!}
                idx={idx}
              />
            ) : null
          )}
        </section>
      )}
    </div>
  );
}
