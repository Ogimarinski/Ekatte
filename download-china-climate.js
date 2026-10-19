require("dotenv").config();

const fs = require("fs/promises");
const { createWriteStream } = require("fs");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");

const path = require("path");

const CDS_API_URL = "https://cds.climate.copernicus.eu/api";
const CDS_API_KEY = process.env.CDS_API_KEY;

const DATASET = "derived-era5-land-daily-statistics";

const START_YEAR = 2021;
const END_YEAR = 2025;

const STATISTICS = [
    {
        apiValue: "daily_mean",
        fileName: "mean"
    },
    {
        apiValue: "daily_minimum",
        fileName: "min"
    },
    {
        apiValue: "daily_maximum",
        fileName: "max"
    }
];

function getDaysInMonth(year, month) {
    // day = 0 означава последния ден на предишния месец
    const daysCount = new Date(year, month, 0).getDate();

    return Array.from(
        { length: daysCount },
        (_, index) => String(index + 1).padStart(2, "0")
    );
}

function buildRequest(year, month, statistic) {
    return {
        variable: ["2m_temperature"],
        year: String(year),
        month: String(month).padStart(2, "0"),
        day: getDaysInMonth(year, month),
        daily_statistic: statistic,
        time_zone: "utc+08:00",
        frequency: "6_hourly",
        area: [53.6, 73.5, 18.1, 135.1]
    };
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}


// 1. Създава job в CDS и връща неговото ID
async function createJob(request) {
    const response = await fetch(
        `${CDS_API_URL}/retrieve/v1/processes/${DATASET}/execution`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "PRIVATE-TOKEN": CDS_API_KEY
            },
            body: JSON.stringify({
                inputs: request
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            `Грешка при създаване на CDS job: ${response.status}`
        );
    }

    const job = await response.json();

    return job.jobID;
}


// 2. Чака job-ът да приключи
async function waitForJob(jobId) {
    while (true) {
        const response = await fetch(
            `${CDS_API_URL}/retrieve/v1/jobs/${jobId}`,
            {
                headers: {
                    "PRIVATE-TOKEN": CDS_API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Грешка при проверка на job: ${response.status}`
            );
        }

        const job = await response.json();

        console.log(`Статус: ${job.status}`);

        if (job.status === "successful") {
            return;
        }

        if (
            job.status === "failed" ||
            job.status === "dismissed"
        ) {
            throw new Error(
                `Job ${jobId} приключи със статус ${job.status}`
            );
        }

        await new Promise(resolve =>
            setTimeout(resolve, 10000)
        );
    }
}


// 3. Взима URL-а на готовия файл
async function getDownloadUrl(jobId) {
    const response = await fetch(
        `${CDS_API_URL}/retrieve/v1/jobs/${jobId}/results`,
        {
            headers: {
                "PRIVATE-TOKEN": CDS_API_KEY
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            `Грешка при взимане на резултата: ${response.status}`
        );
    }

    const results = await response.json();

    return results.asset.value.href;
}


// 4. Сваля файла и го записва
async function downloadFile(url, filePath) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Грешка при сваляне на файла: ${response.status}`
        );
    }

    const readableStream = Readable.fromWeb(response.body);
    const writableStream = createWriteStream(filePath);

    await pipeline(readableStream, writableStream);
}


// Управлява целия процес за една CDS заявка
async function downloadFromCds(request, filePath) {
    const jobId = await createJob(request);

    console.log(`Job ID: ${jobId}`);

    await waitForJob(jobId);

    const downloadUrl = await getDownloadUrl(jobId);

    await downloadFile(downloadUrl, filePath);
}


// Сваля един конкретен climate файл
async function downloadClimateFile(year, month, statistic) {
    const monthFormatted = String(month).padStart(2, "0");

    const directory = path.join(
        __dirname,
        "data",
        "china",
        String(year)
    );

    await fs.mkdir(directory, {
        recursive: true
    });

    const filePath = path.join(
        directory,
        `${monthFormatted}-${statistic.fileName}.nc`
    );

    if (await fileExists(filePath)) {
        console.log(`Пропускам: ${filePath}`);
        return;
    }

    const request = buildRequest(
        year,
        month,
        statistic.apiValue
    );

    console.log(
        `Свалям ${year}-${monthFormatted}-${statistic.fileName}`
    );

    await downloadFromCds(request, filePath);

    console.log(
        `Готово: ${year}-${monthFormatted}-${statistic.fileName}`
    );
}


// Стартира целия процес
async function run() {
    for (let year = START_YEAR; year <= END_YEAR; year++) {
        for (let month = 1; month <= 12; month++) {
            for (const statistic of STATISTICS) {
                try {
                    await downloadClimateFile(
                        year,
                        month,
                        statistic
                    );
                } catch (error) {
                    console.error(
                        `Грешка при ${year}-${month}-${statistic.fileName}:`,
                        error.message
                    );
                }
            }
        }
    }

    console.log(
        "Всички климатични файлове са свалени."
    );
}

run().catch(console.error);