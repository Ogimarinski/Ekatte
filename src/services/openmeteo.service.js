const { sleep } = require("../utils/sleep");

class NonRetryableError extends Error {
    constructor(message) {
        super(message);
        this.name = "NonRetryableError";
    }
}

const MAX_RETRIES = 5;
const START_DATE = "2021-01-01";
const END_DATE = "2025-12-31";

async function fetchClimate(group) {
    const params = new URLSearchParams({
        latitude: group.latitude,
        longitude: group.longitude,
        start_date: START_DATE,
        end_date: END_DATE,
        daily: "temperature_2m_mean,temperature_2m_min,temperature_2m_max",
        timezone: "Europe/Sofia",
        models: "era5"
    });

    const url = `https://archive-api.open-meteo.com/v1/archive?${params}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url);

            if (response.status === 429) {
                const retryAfter = Number(response.headers.get("retry-after"));
                const wait = retryAfter > 0 ? retryAfter * 1000 : 10000;
                console.log(`Retry-After: ${wait}`);

                if (attempt === MAX_RETRIES) {
                    throw new Error("Rate limit exceeded after max retries");
                }

                console.log(
                    `Rate limit. Waiting ${wait}ms (${attempt}/${MAX_RETRIES})`
                );
                await sleep(wait);
                continue;
            }

            if (response.status >= 400 && response.status < 500) {
                throw new NonRetryableError(`Non-retryable client error: ${response.status}`);
            }

            if (!response.ok) {
                throw new Error(
                    `Open-Meteo request failed: ${response.status}`
                );
            }

            const result = await response.json();

            return result.daily;
        } catch (err) {
            console.log(err);

            if (err instanceof NonRetryableError) {
                throw err;
            }

            if (attempt === MAX_RETRIES) {
                throw err;
            }

            await sleep(10000);
        }
    }

}

module.exports = { fetchClimate };