import Report from "../models/report.models.js";
import stats from "../services/stats.services.js";
import Admin from "../models/admin.models.js";
import MemberCode from "../models/membercode.models.js";
import { generateStrings } from "../utils/str_generator.utils.js";

export const getReport = async (req, res, next) => {
  try {
    const { status, tags, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (tags) {
      query.tags = Array.isArray(tags) ? tags : String(tags).split(",");
    }
    if (search)
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { comment: { $regex: search, $options: "i" } },
      ];

    const [reports, totalReports] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * Number(limit))
        .limit(Number(limit)),
      Report.countDocuments(query),
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

export const patchReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNote) updateData.adminNote = adminNote;
    const report = await Report.findOneAndUpdate({ _id: id }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({
      success: true,
      message: status
        ? `report successfully updated to ${status} `
        : "report note successfully updated",
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const { totalReports, totalThisWeek, totalToday, handledRatio } =
      await stats();
    return res.status(200).json({
      success: true,
      data: { totalReports, totalThisWeek, totalToday, handledRatio },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find({}).select("username -_id");
    res.status(200).json({
      success: true,
      data: admins, // [{ username: "admin" }, { username: "case_manager" }, ...]
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdmin = async (req, res, next) => {
  try {
    const { username } = req.params;

    await Admin.findOneAndDelete({ username });

    res.status(200).json({
      success: true,
      message: `${username} removed`,
    });
  } catch (error) {
    next(error);
  }
};

export const getMembershipCode = async (req, res, next) => {
  try {
    const membershipCode = generateStrings(10);
    const newCode = await MemberCode.create({
      code: membershipCode,
      generatedBy: req.user?.id,
    });

    return res.status(201).json({ success: true, code: newCode });
  } catch (error) {
    next(error);
  }
};
