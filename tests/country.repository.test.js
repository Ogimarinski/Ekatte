jest.mock("../db");

const db = require("../db");
const { findAll } = require("../src/repositories/country.repository");


describe("country.repository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("findAll", async () => {
        db.query.mockResolvedValue({ rows: [{ code: "BG", name: "Bulgaria" }] });

        const result = await findAll();

        expect(result).toEqual([{ code: "BG", name: "Bulgaria" }]);
    });
});