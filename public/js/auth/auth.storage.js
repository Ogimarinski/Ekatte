const TOKEN_KEY = "accessToken";

export function saveAccessToken(accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
}

export function getAccessToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function removeAccessToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function isValidToken() {
    const token = getAccessToken();

    if (!token) {
        return false;
    }

    try {
        //atob означава ASCII to binary и декодира Base64/Base64URL-подобната текстова част.
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (!payload.exp) {
            return false;
        }

        return payload.exp * 1000 > new Date();
    } catch {
        removeAccessToken();
        return false;
    }
}