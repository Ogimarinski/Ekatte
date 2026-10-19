function sendHttpResponse(res, status, message, type = "text/plain") {
    res.writeHead(status, { 'content-type': type });
    res.end(message);
}

module.exports = { sendHttpResponse };