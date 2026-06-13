import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { SHEET_TABS } from "@/app/lib/googleSheetsConfig";

interface IeltsLogData {
  name?: string;
  email?: string;
  part1?: string;
  link1?: string;
  part2?: string;
  link2?: string;
  part3?: string;
  link3?: string;
  linkPdf?: string;
}

export async function POST(req: Request) {
  try {
    const { accessToken, sheetId, data, uuid }: {
      accessToken: string;
      sheetId: string;
      data: IeltsLogData;
      uuid?: string;
    } = await req.json();

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // Nếu có uuid -> update hàng
    if (uuid) {
      const findUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'${SHEET_TABS.SPEAKING}'!A:K?majorDimension=ROWS`;
      const findRes = await fetch(findUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const findJson = await findRes.json();

      const rows = findJson.values || [];
      const rowIndex = rows.findIndex((r: string[]) => r[1] === uuid);

      if (rowIndex !== -1) {
        const range = `'${SHEET_TABS.SPEAKING}'!A${rowIndex + 1}:K${rowIndex + 1}`;
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

        const buildRow = (d: IeltsLogData): string[] => [
          timestamp,
          uuid,
          d.name || rows[rowIndex][2] || "",
          d.email || rows[rowIndex][3] || "",
          d.part1 || rows[rowIndex][4] || "",
          d.link1 || rows[rowIndex][5] || "",
          d.part2 || rows[rowIndex][6] || "",
          d.link2 || rows[rowIndex][7] || "",
          d.part3 || rows[rowIndex][8] || "",
          d.link3 || rows[rowIndex][9] || "",
          d.linkPdf || rows[rowIndex][10] || "",
        ];

        await fetch(updateUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: [buildRow(data)] }),
        });

        return NextResponse.json({ success: true, uuid, updated: true });
      }
    }

    // Nếu chưa có uuid -> append hàng mới
    const newUUID = uuid || randomUUID();
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'${SHEET_TABS.SPEAKING}'!A2:append?valueInputOption=USER_ENTERED`;

    const buildRow = (d: IeltsLogData): string[] => [
      timestamp,
      newUUID,
      d.name || "",
      d.email || "",
      d.part1 || "",
      d.link1 || "",
      d.part2 || "",
      d.link2 || "",
      d.part3 || "",
      d.link3 || "",
      d.linkPdf || "",
    ];

    const appendRes = await fetch(sheetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [buildRow(data)] }),
    });

    if (!appendRes.ok) {
      const text = await appendRes.text();
      throw new Error(text || "Failed to append Speaking_list");
    }

    return NextResponse.json({ success: true, uuid: newUUID, created: true });
  } catch (error: any) {
    console.error("Error logging to Google Sheet:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}