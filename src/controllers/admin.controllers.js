import Report from "../models/report.models";
import stats from "../services/stats.services";
import Admin from "../models/admin.models";
import MemberCode from "../models/membercode.models";
import { generateStrings } from "../utils/str_generator.utils";

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

export const patchReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNote) updateData.adminNote = adminNote;
    const report = await Result.findOneAndUpdate({ _id: id }, updateData, {
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
    });

    return res.status(201).json({ success: true, code: newCode });
  } catch (error) {
    next(error);
  }
};
