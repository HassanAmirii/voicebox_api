import Report from "../models/report.models.js";
import stats from "../services/stats.services.js";
import Admin from "../models/admin.models.js";
import MemberCode from "../models/membercode.models.js";
import { generateStrings } from "../utils/str_generator.utils.js";
import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 60 });

export const getReport = async (req, res, next) => {
  try {
    const { status, tags, search, page = 1, limit = 10 } = req.query;
    const query = {};
    const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const parsedLimit = Math.min(
      Math.max(1, Number.parseInt(limit, 10) || 10),
      100,
    );

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
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Report.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      reports,
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(totalReports / parsedLimit),
        totalReports,
        limit: parsedLimit,
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

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "at least one of status or adminNote is required",
      });
    }

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
    const cached = cache.get("report_stats");
    if (cached) return res.status(200).json(cached);
    const { totalReports, totalThisWeek, totalToday, handledRatio } =
      await stats();
    const response = {
      success: true,
      data: { totalReports, totalThisWeek, totalToday, handledRatio },
    };

    cache.set("report_stats", response);
    return res.status(200).json(response);
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

    const deletedAdmin = await Admin.findOneAndDelete({ username });
    if (!deletedAdmin) {
      return res.status(404).json({
        success: false,
        message: "admin not found",
      });
    }

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
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "unauthorized",
      });
    }

    const membershipCode = generateStrings(10);
    const newCode = await MemberCode.create({
      code: membershipCode,
      generatedBy: req.user?.id,
    });

    return res.status(201).json({ success: true, code: newCode.code });
  } catch (error) {
    next(error);
  }
};
