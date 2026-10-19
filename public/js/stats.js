import { fetchStats } from "./api.js";

export async function loadStats() {
    try {
        const data = await fetchStats();

        document.getElementById('stats-regions').textContent = data.regions_count;
        document.getElementById('stats-municipalities').textContent = data.municipalities_count;
        document.getElementById('stats-mayoralties').textContent = data.mayoralties_count;
        document.getElementById('stats-settlements').textContent = data.settlements_count;
    } catch (err) {
        console.error("Грешка при зареждането на статистиката", err);
    }
}