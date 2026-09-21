const FEED_URL =
  "https://angliacommunicators.club/meetings/feed/";

const CALENDAR_URL =
  "https://angliacommunicators.club/meetings/";

const LOCATION =
  "Tesco Community Room, Serpentine Green Shopping Centre, Hampton, Peterborough PE7 8BD";

const MEETING_DURATION_MS = 2 * 60 * 60 * 1000;

function escapeICS(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function toICSDate(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export default async () => {
  try {
    const response = await fetch(FEED_URL);

    if (!response.ok) {
      throw new Error(
        `Toastmasters feed returned HTTP ${response.status}`
      );
    }

    const events = await response.json();

    const now = new Date();

    const upcoming = events
      .filter((event) => {
        const start = new Date(event.start);
        return start >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.start) - new Date(b.start)
      );

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Anglia Communicators//Toastmasters Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Anglia Communicators Toastmasters",
      "X-WR-TIMEZONE:Europe/London",
      "REFRESH-INTERVAL;VALUE=DURATION:P1W",
      "X-PUBLISHED-TTL:P1W",
    ];

    for (const event of upcoming) {
      const start = new Date(event.start);

      const end = new Date(
        start.getTime() + MEETING_DURATION_MS
      );

      const uid =
        start.toISOString().replace(/[-:.TZ]/g, "") +
        "-" +
        event.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
        "@angliacommunicators.club";

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${toICSDate(new Date())}`,
        `DTSTART:${toICSDate(start)}`,
        `DTEND:${toICSDate(end)}`,
        `SUMMARY:${escapeICS(event.title)}`,
        `LOCATION:${escapeICS(LOCATION)}`,
        "DESCRIPTION:Anglia Communicators Toastmasters Club 3380",
        `URL:${CALENDAR_URL}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT"
      );
    }

    lines.push("END:VCALENDAR");

    const calendar =
      lines.join("\r\n") + "\r\n";

    return new Response(calendar, {
      status: 200,
      headers: {
        "Content-Type":
          "text/calendar; charset=utf-8",
        "Cache-Control":
          "public, max-age=300",
      },
    });

  } catch (error) {

    console.error(error);

    return new Response(
      "Unable to retrieve the Toastmasters calendar.",
      {
        status: 500,
        headers: {
          "Content-Type":
            "text/plain; charset=utf-8",
        },
      }
    );
  }
};