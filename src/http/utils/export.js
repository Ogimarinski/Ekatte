const ExcelJS = require('exceljs');

function formatCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function csvLine(row, headers) {
    return headers.map(h => formatCell(row[h])).join(",");
}

function waitForDrain(res) {
    if (res.destroyed) {
        return Promise.reject(new Error("Response-ът е затворен."));
    }

    return new Promise((resolve, reject) => {
        function cleanup() {
            res.off("drain", onDrain);
            res.off("close", onClose);
        }

        function onDrain() {
            cleanup();
            resolve();
        }

        function onClose() {
            cleanup();
            reject(new Error("Response-ът беше затворен преди drain."));
        }

        res.on("drain", onDrain);
        res.on("close", onClose);
    });
}

async function writeWithBackpressure(res, chunk) {
    if (!res.write(chunk)) {
        await waitForDrain(res);
    }
}

async function streamCsv(stream, headers, res) {
    let responseDestroyedByServer = false;
    res.on("close", () => {
        if (!res.writableEnded) {
            if (!responseDestroyedByServer) {
                console.error(
                    "CSV response-ът беше прекъснат преждевременно."
                );
            }

            stream.destroy();
        }
    });
    try {
        //Това записва BOM (Byte Order Mark) в началото на CSV файла за кирилица.
        await writeWithBackpressure(res, "\uFEFF");

        await writeWithBackpressure(res, headers.join(",") + "\n");
        for await (const row of stream) {
            await writeWithBackpressure(res, csvLine(row, headers) + "\n");
        }
    } catch (err) {
        // Ако клиентът е прекъснал, "close" слушателят вече е логнал — не логваме втори път.
        if (!res.destroyed) {
            console.error("Грешка при стриймване на CSV:", err);
        }

        stream.destroy(err);

        responseDestroyedByServer = true;

        res.destroy();

        return;
    }

    if (!responseDestroyedByServer) res.end();
}

async function streamExcel(stream, columns, res) {
    let responseDestroyedByServer = false;


    res.on("close", () => {
        if (!res.writableEnded) {
            if (!responseDestroyedByServer) {
                console.error(
                    "EXCEL response-ът беше прекъснат преждевременно."
                );
            }

            stream.destroy();
        }
    });

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
    const worksheet = workbook.addWorksheet("Data");

    worksheet.columns = columns.map(column => ({
        header: column.header,
        key: column.key,
        width: column.width ?? 20
    }));

    try {
        for await (const row of stream) {
            worksheet.addRow(row).commit();
        }

        await worksheet.commit();
        await workbook.commit();
    } catch (err) {
        console.error("Грешка при стриймване на EXCEL:", err);
        responseDestroyedByServer = true;

        stream.destroy(err);

        res.destroy(err);

    }
}

module.exports = {
    streamCsv,
    streamExcel
};
