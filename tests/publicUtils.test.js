import { isValidDateFormat } from "../public/js/utils/dateFormatValidation";


describe("isValidDateFormat", () => {
    test("should return true when date format is valid", () => {
        expect(isValidDateFormat("2025-02-01")).toBe(true);
    });

    test("should return false when date format is invalid", () => {
        expect(isValidDateFormat("888888-08-08")).toBe(false);
    });
});