import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("sija_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const student = verifySessionToken(token);
  if (!student) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    student: {
      id: student.id,
      name: student.name,
      class: student.class,
      nis: student.nis,
      daily_goal_ml: student.daily_goal_ml,
    },
  });
}
