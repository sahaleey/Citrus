import Order from "../models/Order.js";
import Food from "../models/Food.js";
import Revenue from "../models/Revenue.js";

const getStartDate = (period) => {
  const now = new Date();
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  if (period === "lastYear") return new Date(now.getFullYear() - 1, 0, 1);
  return new Date();
};

// ✅ Revenue calculations from Revenue model
const calculateRevenue = async (startDate, endDate) => {
  const matchStage = {
    date: {
      $gte: startDate,
      ...(endDate ? { $lte: endDate } : {}),
    },
  };

  const [revenueData] = await Revenue.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalEntries: { $sum: 1 },
      },
    },
  ]);

  return {
    totalRevenue: revenueData?.totalRevenue || 0,
    totalEntries: revenueData?.totalEntries || 0,
  };
};

// ✅ Top selling items from Food model (persistent counter)
const getTopSellingItems = async () => {
  return Food.aggregate([
    {
      $project: {
        name: 1,
        price: 1,
        image: 1,
        totalSold: { $ifNull: ["$totalSold", 0] },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);
};

// ✅ Monthly sales trend now also uses Revenue, not Orders
const getMonthlySalesTrend = async (startDate) => {
  const trend = await Revenue.aggregate([
    {
      $match: {
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $month: "$date" },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        revenue: "$totalRevenue",
      },
    },
    { $sort: { month: 1 } },
  ]);

  return trend;
};

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = getStartDate("month");
    const startOfYear = getStartDate("year");
    const startOfLastYear = getStartDate("lastYear");
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);

    // Fetch everything in parallel
    const [monthData, yearData, lastYearData, topItems, salesTrend] =
      await Promise.all([
        calculateRevenue(startOfMonth),
        calculateRevenue(startOfYear),
        calculateRevenue(startOfLastYear, endOfLastYear),
        getTopSellingItems(),
        getMonthlySalesTrend(startOfYear),
      ]);

    // Format sales trend for all 12 months
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedSalesTrend = monthNames.map((name, idx) => {
      const monthNum = idx + 1;
      const data = salesTrend.find((s) => s.month === monthNum);
      return { name, revenue: data ? data.revenue : 0 };
    });

    res.json({
      success: true,
      data: {
        currentMonthRevenue: monthData.totalRevenue,
        currentMonthOrders: monthData.totalEntries,
        currentYearRevenue: yearData.totalRevenue,
        lastYearRevenue: lastYearData.totalRevenue,
        topSellingItems: topItems,
        salesTrend: formattedSalesTrend,
      },
    });
  } catch (err) {
    console.error("Error in getDashboardStats:", err);
    res.status(500).json({
      success: false,
      message: "Server error getting stats",
      error: err.message,
    });
  }
};
