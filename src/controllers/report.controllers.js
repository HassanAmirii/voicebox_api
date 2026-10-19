import Report from "../models/report.models.js";
import { generateStrings } from "../utils/str_generator.utils.js";
import { validateCreateReport } from "../validators/report.validators.js";
export const createReport = async (req, res, next) => {
  try {
    const { error } = validateCreateReport.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { title, tags, identity, comment } = req.body;

    const ticketId = generateStrings(10);
    const newReport = new Report({
      title,
      tags,
      identity,
      comment,
      ticketId,
    });
    await newReport.save();
    return res.status(201).json({ success: true, message: "report submitted", newReport });
  } catch (error) {
    next(error);
  }
};

export const getAllReports = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;

    const [reports, totalReports] = await Promise.all([
      Report.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Report.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalReports / limit);

    return res.status(200).json({
      success: true,
      reports,
      pagination: {
        totalReports,
        currentPage: page,
        totalPages,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const findReport = async(req, res, next )=> {

  try {
    const {ticketId} = req.params;
    const getSingleReport = await Report.findOne({ticketId});
    if (!getSingleReport) {
      return res.status(404).json({ message: "Report not found" });
    }
    return res.status(200).json({ success: true, report: getSingleReport });
  } catch (error) {
    next(error);
  }
};