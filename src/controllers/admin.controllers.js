import Report from "../models/report.models";
export const getReport = async (req, res, next) => {
  try {
    const { status, tags, search, page = 1, limit = 10 } = req.body;
    const query = {};

    if (status) query.status = status;
    if (tags) query.tags = tags;
    if (search)
      query.$or = [
        { title: { $regex: search, $option: "i" } },
        { text: { $regex: search, $option: "i" } },
      ];

    const [reports, totalReports] = await Promise.all([
      (Report.find(query)
        .skip((page - 1) * 10)
        .limit(Number(limit)),
      Report.countDocument(query)),
    ]);

    res.status(200).json({
      success: true,
      reports,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReports / limit),
        totalReports,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};
