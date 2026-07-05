import { WORKER_URL } from "../config.js";

export async function fetchHtmlWithWorker(targetUrl) {
  const res = await fetch(
    `${WORKER_URL}?route=proxy&url=${encodeURIComponent(targetUrl)}`,
  );
  if (!res.ok) throw new Error("Worker proxy failed");
  return await res.text();
}

export function parseSteamDate(rawStr, isLongMonth = false) {
  if (!rawStr || !rawStr.includes("@")) return rawStr;
  try {
    let [dPart, tPart] = rawStr.split("@").map((s) => s.trim());
    dPart = dPart.replace(/,/g, "");

    if (!/\d{4}/.test(dPart)) dPart += ` ${new Date().getFullYear()}`;
    tPart = tPart.replace(/([ap]m)/i, " $1").toUpperCase();

    const naiveDate = new Date(`${dPart} ${tPart}`);
    let offset = "-0800";

    if (!isNaN(naiveDate.getTime())) {
      const tzStr = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        timeZoneName: "short",
      }).format(naiveDate);
      if (tzStr.includes("PDT")) offset = "-0700";
    }

    const parsed = new Date(`${dPart} ${tPart} GMT${offset}`);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleString(undefined, {
        year: "numeric",
        month: isLongMonth ? "long" : "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  } catch {}
  return rawStr;
}
