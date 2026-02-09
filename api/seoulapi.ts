import type { VercelRequest, VercelResponse } from "@vercel/node";

const ENDPOINTS: Record<string, string> = {
  event: "culturalEventInfo",
  night: "viewNightSpot",
  space: "culturalSpaceInfo",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const API_KEY = process.env.SEOUL_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "API_KEY is not set" });
  }

  const { type = "event" } = req.query;
  const endpoint = ENDPOINTS[type as string];

  if (!endpoint) {
    return res.status(400).json({ error: "Invalid type parameter" });
  }

  const url = `http://openapi.seoul.go.kr:8088/${API_KEY}/json/${endpoint}/1/1000/`;
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `서울시 API 호출 실패 (status ${response.status})`,
      });
    }
    const text = await response.text();

    if (text.trim().startsWith("<")) {
      return res.status(500).json({
        error: "서울시 API가 XML을 반환했습니다. 형식이 잘못됐을 수 있습니다.",
        raw: text.slice(0, 300),
      });
    }

    const data = JSON.parse(text);

    if (!data[endpoint]?.row) {
      return res.status(500).json({
        error: "데이터 구조가 예상과 다릅니다.",
        raw: JSON.stringify(data).slice(0, 300),
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "서울시 OpenAPI 호출 실패",
      detail: (error as Error).message,
    });
  }
}
