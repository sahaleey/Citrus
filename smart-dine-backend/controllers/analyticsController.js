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
  console.log(
    `💰 Revenue from ${startDate.toLocaleDateString()} to ${
      endDate ? endDate.toLocaleDateString() : "now"
    }:`,
    revenueData
  );
  return {
    totalRevenue: revenueData?.totalRevenue || 0,
    totalEntries: revenueData?.totalEntries || 0,
  };
};

// ✅ Top selling items from Food model (persistent counter)
const getTopSellingItems = async () => {
  const items = await Food.aggregate([
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
  console.log("🏆 Top selling items:", items);
  return items;
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
  console.log("📈 Monthly sales trend:", trend);
  return trend;
};

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = getStartDate("month");
    const startOfYear = getStartDate("year");
    const startOfLastYear = getStartDate("lastYear");
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);

    // Check if Revenue collection has any data
    const totalRevenueRecords = await Revenue.countDocuments();

    if (totalRevenueRecords === 0) {
      console.warn(
        '⚠️ No revenue records found! Make sure orders are being marked as "Served"'
      );
    }

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
    console.error("❌ Error in getDashboardStats:", err);
    res.status(500).json({
      success: false,
      message: "Server error getting stats",
      error: err.message,
    });
  }
};

// analyticsController.js - Add this function at the end

export const migrateExistingOrders = async (req, res) => {
  try {
    // Get all served orders
    const servedOrders = await Order.find({ status: "Served" });

    let created = 0;
    let skipped = 0;

    for (const order of servedOrders) {
      // Check if revenue already exists (avoid duplicates)
      const existingRevenue = await Revenue.findOne({
        guestId: order.guestId,
        tableId: order.tableId,
        totalAmount: order.totalPrice,
        date: {
          $gte: new Date(order.createdAt).setHours(0, 0, 0, 0),
          $lte: new Date(order.createdAt).setHours(23, 59, 59, 999),
        },
      });

      if (!existingRevenue) {
        await Revenue.create({
          guestId: order.guestId,
          tableId: order.tableId,
          totalAmount: order.totalPrice,
          date: order.createdAt, // Use original order date
        });
        created++;
      } else {
        skipped++;
      }
    }

    res.json({
      success: true,
      message: `Migration complete: ${created} revenue records created, ${skipped} already existed`,
      details: { created, skipped, total: servedOrders.length },
    });
  } catch (error) {
    console.error("❌ Migration error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
