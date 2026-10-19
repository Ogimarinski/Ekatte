const { sendHttpResponse } = require("../src/http/utils/response");

test("defaults content-type to text/plain", () => {
    const res = { writeHead: jest.fn(), end: jest.fn() };

    sendHttpResponse(res, 200, "ok");

    expect(res.writeHead).toHaveBeenCalledWith(200, { "content-type": "text/plain" });
});