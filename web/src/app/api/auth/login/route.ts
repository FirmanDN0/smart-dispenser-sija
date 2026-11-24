import { NextRequest, NextResponse } from "next/server";
import { verifyStudentCredentials, createSessionToken } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  studentId: z.string().min(1, "Pilih nama siswa"),
  pin: z.string().length(4, "PIN harus 4 digit angka").regex(/^\d{4}$/, "PIN hanya boleh berupa angka"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { studentId, pin } = parsed.data;
    const result = verifyStudentCredentials(studentId, pin);

    if (!result.success || !result.student) {
      return NextResponse.json(
        { error: result.error || "Autentikasi gagal" },
        { status: 401 }
      );
    }

    const token = createSessionToken(result.student);
    const response = NextResponse.json({
      success: true,
      student: {
        id: result.student.id,
        name: result.student.name,
        class: result.student.class,
        nis: result.student.nis,
        daily_goal_ml: result.student.daily_goal_ml,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set("sija_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Login API Error]:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server" }, { status: 500 });
  }
}
