export async function handleResponse(res) {
    if (!res.ok) {
        let errMsg = "Request failed";

        try {
            const err = await res.json();
            if (err.error) errMsg = err.error;
        } catch {
            // игнорира инвалиден json отговор
        }

        const error = new Error(errMsg);
        error.status = res.status;
        throw error;
    }

    try {
        return await res.json();
    } catch {
        throw new Error("Invalid JSON response");
    }
}
