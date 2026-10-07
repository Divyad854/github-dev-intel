import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { handle, requireSession } from "@/lib/http";
import AnalysisHistory from "@/models/AnalysisHistory";
import User from "@/models/User";

export const GET = handle(async () => {
  await requireSession(true);
  await connectDB();

  const [totalUsers, totalAnalyses, mostAnalyzed, recentUsers, recentAnalyses] = await Promise.all([
    User.countDocuments(),
    AnalysisHistory.countDocuments(),
    AnalysisHistory.aggregate([
      { $group: { _id: "$usernameLower", username: { $first: "$username" }, avatar: { $first: "$avatar" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    User.find().sort({ createdAt: -1 }).limit(10).select("name email role createdAt").lean(),
    AnalysisHistory.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("username avatar createdAt userId")
      .populate("userId", "name email")
      .lean(),
  ]);

  return NextResponse.json({
    totalUsers,
    totalAnalyses,
    mostAnalyzed: mostAnalyzed.map((m) => ({ username: m.username, avatar: m.avatar, count: m.count })),
    recentUsers: recentUsers.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: new Date(u.createdAt).toISOString(),
    })),
    recentAnalyses: recentAnalyses.map((a) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = a.userId as any;
      return {
        id: String(a._id),
        username: a.username,
        avatar: a.avatar,
        createdAt: new Date(a.createdAt).toISOString(),
        by: user?.name ?? "deleted user",
      };
    }),
  });
});
