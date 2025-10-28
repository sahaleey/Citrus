import React, { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import { toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  BarChart2,
  Calendar,
  AlertTriangle,
  Star,
} from "lucide-react";
import Spinner from "../components/Spinner";

const OwnerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const fetchStats = async () => {
    try {
      setError(null);

      const { data } = await api.get("/analytics/stats");

      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch stats.");
      }
    } catch (err) {
      console.error("❌ Error fetching dashboard stats:", err);
      console.error("Response:", err.response?.data);

      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load dashboard data";

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleMigration = async () => {
    if (
      !window.confirm(
        "This will create revenue records for all existing served orders. Continue?"
      )
    ) {
      return;
    }

    setIsMigrating(true);
    try {
      const { data } = await api.post("/analytics/migrate");

      if (data.success) {
        toast.success(
          `✅ Success!\n\n${data.message}\n\nDetails:\n- Created: ${
            data.details?.created || 0
          }\n- Skipped: ${
            data.details?.skipped || 0
          }\n\nRefreshing dashboard...`
        );
        fetchStats(); // Refresh the dashboard
      } else {
        throw new Error(data.message || "Migration failed");
      }
    } catch (err) {
      console.error("❌ Migration error:", err);
      toast.error(
        `❌ Migration failed: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setIsMigrating(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // auto-refresh every 30s
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner text="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-red-300 bg-red-50 p-12 text-center text-red-700">
        <AlertTriangle size={48} className="mb-4" />
        <h3 className="text-2xl font-semibold">Failed to Load Dashboard</h3>
        <p className="mt-2 text-sm">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-6 rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-700">
        <AlertTriangle size={48} className="mb-4" />
        <h3 className="text-2xl font-semibold">No Data Available</h3>
        <p className="mt-2 text-sm">
          Dashboard statistics are not available yet.
        </p>
        <button
          onClick={fetchStats}
          className="mt-6 rounded-md bg-gray-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-[var(--text-color)]">
          Owner Dashboard
        </h1>

        {/* Migration Button - only show if there's no revenue but items exist */}
        {stats.currentYearRevenue === 0 &&
          stats.topSellingItems?.length > 0 && (
            <button
              onClick={handleMigration}
              disabled={isMigrating}
              className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isMigrating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Migrating...
                </>
              ) : (
                <>
                  <TrendingUp size={18} />
                  Create Revenue Records
                </>
              )}
            </button>
          )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Month Revenue"
          value={`₹${(stats.currentMonthRevenue || 0).toFixed(2)}`}
          icon={<DollarSign size={24} className="text-green-500" />}
          change={`+${stats.currentMonthOrders || 0} orders`}
        />
        <StatCard
          title="Current Year Revenue"
          value={`₹${(stats.currentYearRevenue || 0).toFixed(2)}`}
          icon={<Calendar size={24} className="text-blue-500" />}
          change="This year-to-date"
        />
        <StatCard
          title="Last Year Revenue"
          value={`₹${(stats.lastYearRevenue || 0).toFixed(2)}`}
          icon={<TrendingUp size={24} className="text-orange-500" />}
          change="All of last year"
        />
        <StatCard
          title="Top Item (Month)"
          value={stats.topSellingItems?.[0]?.name || "N/A"}
          icon={<Star size={24} className="text-yellow-500" />}
          change={`${stats.topSellingItems?.[0]?.totalSold || 0} sold`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartContainer
            title="This Year's Revenue Trend"
            icon={<BarChart2 />}
          >
            <RevenueChart data={stats.salesTrend || []} />
          </ChartContainer>
        </div>

        <div className="lg:col-span-2">
          <ChartContainer
            title="Top 5 Selling Items (This Month)"
            icon={<ShoppingCart />}
          >
            <TopItemsChart data={stats.topSellingItems || []} />
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---
const StatCard = ({ title, value, icon, change }) => (
  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-5 shadow-sm transition hover:shadow-md">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-[var(--text-color-secondary)]">
        {title}
      </p>
      <div className="rounded-full bg-green-100 p-2">{icon}</div>
    </div>
    <div className="mt-2">
      <h3 className="text-3xl font-bold text-[var(--text-color)]">{value}</h3>
      <p className="mt-1 text-xs text-[var(--text-color-secondary)]">
        {change}
      </p>
    </div>
  </div>
);

const ChartContainer = ({ title, icon, children }) => (
  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-5 shadow-sm">
    <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-[var(--text-color)]">
      {React.cloneElement(icon, {
        size: 20,
        className: "text-[var(--primary-color)]",
      })}
      {title}
    </h3>
    <div className="h-[350px] w-full">{children}</div>
  </div>
);

const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>No revenue data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
        <XAxis dataKey="name" stroke="var(--text-color-secondary)" />
        <YAxis
          stroke="var(--text-color-secondary)"
          tickFormatter={(val) => `₹${val / 1000}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
            borderRadius: "0.5rem",
          }}
          formatter={(value) => [`₹${value.toFixed(2)}`, "Revenue"]}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#399c6c"
          strokeWidth={2}
          dot={{ r: 4, fill: "#399c6c" }}
          activeDot={{ r: 6, fill: "#399c6c" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const TopItemsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>No sales data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
        <XAxis type="number" stroke="var(--text-color-secondary)" />
        <YAxis
          dataKey="name"
          type="category"
          stroke="var(--text-color-secondary)"
          width={80}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
            borderRadius: "0.5rem",
          }}
          formatter={(value) => [value, "Units Sold"]}
        />
        <Bar dataKey="totalSold" fill="#5dbd8b" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default OwnerDashboard;
