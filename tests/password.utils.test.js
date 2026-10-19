jest.mock("bcrypt");
const bcrypt = require("bcrypt");
const { hashPassword, comparePassword } = require("../src/utils/password.utils");

describe("password.utils", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("hashPassword calls bcrypt.hash with cost factor 12", async () => {
        bcrypt.hash.mockResolvedValue("hashed-value");

        const result = await hashPassword("myPassword");

        expect(bcrypt.hash).toHaveBeenCalledWith("myPassword", 12);
        expect(result).toBe("hashed-value");
    });

    test("comparePassword calls bcrypt.compare with password then hash", async () => {
        bcrypt.compare.mockResolvedValue(true);

        const result = await comparePassword("myPassword", "storedHash");

        expect(bcrypt.compare).toHaveBeenCalledWith("myPassword", "storedHash");
        expect(result).toBe(true);
    });
});