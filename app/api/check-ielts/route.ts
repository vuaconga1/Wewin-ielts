import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { accessToken, sheetId, email }: 
    { accessToken: string; sheetId: string; email: string } 
    = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const sheetName = "Listening_list";

    // Fetch toàn bộ cột Email
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'${sheetName}'!H:H?majorDimension=COLUMNS`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const json = await res.json();

    const emails: string[] = json.values?.[0] || [];

    // Tìm email trong sheet (bắt đầu từ row 3 trở đi)
    const userExists = emails.slice(2).includes(email);

    return NextResponse.json({ exists: userExists });
  } catch (err: any) {
    console.error("❌ CHECK ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
