const FEED_URL =
  "https://angliacommunicators.club/meetings/feed/";

export default async () => {
  try {
    const response = await fetch(FEED_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const events = await response.json();

    console.log(`Successfully received ${events.length} events`);

    return new Response(
      `SUCCESS - Netlify received ${events.length} events`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      `FAILED - ${error.message}`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );
  }
};

export const config = {
  schedule: "0 6 * * *",
};
