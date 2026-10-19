const helper = require("../src/helper");

describe("Helper: generateEkatteFrom4", () => {
    test("should generate correct EKATTE with 5 digits", () => {
        expect(helper.generateEkatteFrom4("0001")).toBe("00011");
    });

    test("should return 0 as check digit if remainder is 10", () => {
        // Трябва ни сума, чийто остатък при деление на 11 е 10.
        // Пример: '1112' -> (1*9 + 1*7 + 1*3 + 2*1) = 9+7+3+2 = 21. 
        // 21 % 11 = 10. По логиката в кода трябва да върне 0.
        expect(helper.generateEkatteFrom4("1112")).toBe("11120");
    });

    test("should handle codes with zeros correctly", () => {
        expect(helper.generateEkatteFrom4("0000")).toBe("00000");
    });
});