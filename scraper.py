import json
import urllib.request
from datetime import datetime, timezone, timedelta

FEED_URL = "https://angliacommunicators.club/meetings/feed/"

CALENDAR_NAME = "Anglia Communicators Toastmasters"
CALENDAR_URL = "https://angliacommunicators.club/meetings/"

LOCATION = (
    "Tesco Community Room, "
    "Serpentine Green Shopping Centre, "
    "Hampton, Peterborough PE7 8BD"
)

MEETING_DURATION = timedelta(hours=2)


def escape_ics(text):
    """Escape text for the iCalendar format."""
    return (
        str(text)
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


# ---------------------------------------------------------
# 1. Download Toastmasters feed
# ---------------------------------------------------------

print("Downloading Toastmasters calendar...")

with urllib.request.urlopen(FEED_URL, timeout=20) as response:
    events = json.load(response)

print(f"Total events received: {len(events)}")


# ---------------------------------------------------------
# 2. Keep future events only
# ---------------------------------------------------------

now = datetime.now(timezone.utc)

upcoming = []

for event in events:

    start = datetime.fromisoformat(event["start"])

    if start.astimezone(timezone.utc) >= now:
        upcoming.append(event)


print(f"Upcoming events: {len(upcoming)}")


# ---------------------------------------------------------
# 3. Sort events by date
# ---------------------------------------------------------

upcoming.sort(key=lambda event: event["start"])


# ---------------------------------------------------------
# 4. Build ICS calendar
# ---------------------------------------------------------

ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Anglia Communicators//Toastmasters Calendar//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Anglia Communicators Toastmasters",
    "X-WR-TIMEZONE:Europe/London",
]


for event in upcoming:

    start = datetime.fromisoformat(event["start"])

    # Convert to UTC for the ICS file
    start_utc = start.astimezone(timezone.utc)

    # Meetings normally last 2 hours
    end_utc = start_utc + MEETING_DURATION

    dtstart = start_utc.strftime("%Y%m%dT%H%M%SZ")
    dtend = end_utc.strftime("%Y%m%dT%H%M%SZ")

    # Stable ID.
    # Same meeting = same UID every time the scraper runs.
    uid = (
        start.strftime("%Y%m%dT%H%M")
        + "-"
        + event["title"].lower().replace(" ", "-")
        + "@angliacommunicators.club"
    )

    title = escape_ics(event["title"])

    ics.extend([
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTART:{dtstart}",
        f"DTEND:{dtend}",
        f"SUMMARY:{title}",
        f"LOCATION:{escape_ics(LOCATION)}",
        "DESCRIPTION:Anglia Communicators Toastmasters Club 3380",
        f"URL:{CALENDAR_URL}",
        "END:VEVENT",
    ])


ics.append("END:VCALENDAR")


# ---------------------------------------------------------
# 5. Save calendar
# ---------------------------------------------------------

with open(
    "meetings.ics",
    "w",
    encoding="utf-8",
    newline="\r\n"
) as file:

    file.write("\r\n".join(ics) + "\r\n")


print()
print("Calendar created successfully:")
print("meetings.ics")
print()
print("Upcoming meetings:")

for event in upcoming:
    print(
        event["start"],
        "-",
        event["title"]
    )