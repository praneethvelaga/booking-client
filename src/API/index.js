import APIConfig from './constants';
import { loadUserState, clearUserState } from '../Pages/Auth/+state/loadUserState';

const privateEndPoints = APIConfig.privateEndPoints;
const publicEndPoints = APIConfig.publicEndPoints;
const HOSTNAME = APIConfig.hostname;

const AppAPI = {};

// Handling public endpoints
publicEndPoints.forEach((element, key) => {
    AppAPI[key] = {};
    const methods = Array.isArray(element.method) ? element.method : [element.method];
    methods.forEach((method) => {
        AppAPI[key][method] = (params, payload) => fetcher(method, key, element.path, params, payload);
    });
});

// Handling private endpoints
privateEndPoints.forEach((element, key) => {
    AppAPI[key] = {};
    const methods = Array.isArray(element.method) ? element.method : [element.method];
    methods.forEach((method) => {
        AppAPI[key][method] = (params, payload) => fetcher(method, key, element.path, params, payload);
    });
});

function fetcher(method, key, inputEndPoint, inputParams, body) {
    console.log("HOSTNAME:", HOSTNAME);

    let endPoint = inputEndPoint;
    const params = inputParams;

    return new Promise(async (resolve, reject) => {
        const req = {
            method: method.toUpperCase(),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        };

        // If the request is for a private endpoint, attach authorization
        if (privateEndPoints.get(key)) {
            let accessToken = loadUserState().token;
            if (accessToken) {
                req.headers.Authorization = `${accessToken}`;
            } else {
                clearUserState();
                window.location.pathname = '/login';
                return reject({ code: 401, serverMessage: 'No access token' });
            }
        }

        if (body) {
            req.body = JSON.stringify(body);
        }

        let thisUrl = HOSTNAME + endPoint;
        if (params) {
            thisUrl += params; // e.g., "?que=123"
        }

        fetch(thisUrl, req)
            .then(async (response) => {
                let responseJson = {};
                try {
                    responseJson = await response.json();
                    //console.log(responseJson);
                } catch (err) {
                    // If JSON parsing fails, return an empty array for non-critical errors
                    if (response.status === 404 || response.status === 400) {
                        return { data: [], status: response.status };
                    }
                    throw response;
                }

                if (response.status === 200 || response.status === 201) {
                    responseJson.status = response.status;
                    return responseJson;
                } else if (response.status === 400 || response.status === 404) {
                    // Handle "not found" or "bad request" gracefully
                    return { data: [], status: response.status };
                }

                throw responseJson;
            })
            .then((res) => {
                if (res.error === "User session is inactive") {
                    clearUserState();
                    window.location.pathname = '/login';
                    return reject(res);
                }
                resolve(res.data || res); // Ensure we resolve with data or the full response
            })
            .catch((err) => {
                console.log(err);
                if (err.status === 401) {
                    // Only redirect on explicit 401 Unauthorized
                    clearUserState();
                    window.location.pathname = '/login';
                    reject({ code: 401, serverMessage: 'Unauthorized' });
                } else {
                    // For other errors (e.g., 404, 500), resolve with empty data
                    resolve({ data: [], status: err.status || 500 });
                }
            });
    });
}

export default AppAPI;