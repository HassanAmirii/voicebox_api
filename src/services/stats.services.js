import Report from "../models/report.models.js";

const stats = async (req, res, next) => {
  try {
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [totalReports, totalThisWeek, totalToday, handledCount] =
      await Promise.all([
        Report.countDocuments({}),

        Report.countDocuments({
          createdAt: { $gte: startOfWeek },
        }),

        Report.countDocuments({
          createdAt: { $gte: startOfToday },
        }),

        Report.countDocuments({
          status: { $eq: "Handled" },
        }),
      ]);

    return {
      totalReports,
      totalThisWeek,
      totalToday,
      handledRatio:
        totalReports === 0 ? 0 : (handledCount / totalReports) * 100,
    };
  } catch (error) {
    next(error);
  }
};

export default stats;
