import {useState, useEffect } from "react";
import { isElementAccessExpression } from "typescript";

export class DataError extends Error{
    constructor(msg: string){
        super(msg);
    }
}

const query_string_start: string = "?";
const query_string_separator: string = "+";

export function getRequestURL(url: string, params: Record<string, string|null>){
    let new_url: string = url;
    let query_flag: boolean = false;
    for(const [key, val] of Object.entries(params)){
        if(val == null || val.length <= 0){
            continue;
        }else{
            if(!query_flag){
                new_url = new_url + query_string_start;
                query_flag = true;
            }else{
                new_url = new_url + query_string_separator;
            }
            new_url = new_url + key + "=" + val;
        }
    }
    return new_url;
}

interface RequestData{
    url: string;
    method: string;
    data?: any;
}

export interface FetchResponse<T>{
    data: T | null;
    error: string | null;
    loading: boolean;
}

const cookie_key = {
    csrf_token: "csrftoken"
};

const regex = {
    attr_seperator: "=",
    cookie_seperator: ";"
};

function getCookies(name: string | null = null){
    let cookieArray = document.cookie.split(regex.cookie_seperator);
    let cur_cookie: string[];
    if(name != null && name.length > 0){
        for (let i = 0; i < cookieArray.length; i++) {
            cur_cookie = cookieArray[i].split(regex.attr_seperator);
            if (cur_cookie[0] == name) {
                return cur_cookie[1];
            }
        }
        return "";
    }else{
        // Get All Cookies
        // But for now just raise error
        throw new TypeError("Name must be a string with length greater than 0");
    }
}

function setCookie(key: string, value: string){
    let tmp_str: string = key + regex.attr_seperator + value;
    document.cookie = document + regex.cookie_seperator + tmp_str;
}

export interface BooleanResponse{
    success: boolean;
}

const token_url = "/api/token";
const token_response_key = "token";

function getToken(){
    let crsf_token = getCookies(cookie_key.csrf_token);
    if(!(typeof(crsf_token) == 'string' && crsf_token.length > 0)){
        return fetch(token_url, {
            method: "GET"
        })
        .then((response) =>{
            if (response) {
                if (!response.ok || response.status != 200) {
                    throw new Error("Issue with sending from " + response.url + "   Status:" + response.status);
                }
                return response.json(); // Assumes JSON Response
            } else {
                throw new Error("Did not get a response from Token Request");
            }
        })
        .then((resp_json) =>{
            return resp_json[token_response_key] || "";
        })
        .then((token_string: string)=>{
            setCookie(cookie_key.csrf_token, token_string);
            return token_string;
        });
    }else{
        return new Promise(resolve => resolve(crsf_token));
    }
}

function createGetURL(request: RequestData){
    let cur_url = request.url;
    if(request.data){
        let query_started = false;
        for(const [key, val] of Object.entries(request.data)){
            if(!query_started){
                cur_url = cur_url + "?";
                query_started = true;
            }else{
                cur_url = cur_url + "&";
            }
            cur_url = cur_url + key + "=" + val;
        }
    }
    return cur_url;
}

export function getFetch<T>(request: RequestData, transformFunc?: (jsonObj: Record<any, any>) => T): Promise<void | T>{
    if(request.method == "POST"){
        return getToken()
        .then(function(crsf_token){
            if(typeof(crsf_token) == 'string'){
                return fetch(request.url, {
                    method: request.method,
                    mode: "cors",
                    cache: "no-cache",
                    credentials: "same-origin",
                    headers : {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': crsf_token
                    },
                    body: JSON.stringify(request.data)
                });
            }else{
                throw new TypeError("Expected a string for CRSF Token but got: " + typeof(crsf_token) +  " instead");
            }
        })
        .then(function (response) {
            if (response) {
                if (!response.ok || response.status != 200) {
                    throw new Error("Issue with sending from " + response.url + "   Status:" + response.status);
                }
                return response.json(); // Assumes JSON Response
            } else {
                throw new Error("Did not get a response from " + request.url);
            }
        })
        .then((resp_json) =>{
            let resp_data: T;
            console.log("JSON");
            console.log(resp_json);
            if(transformFunc){
                resp_data = transformFunc(resp_json);
            }else{
                resp_data = resp_json;
            }
            console.log(resp_data);
            //setLoading(false);
            return resp_data;
        });
    }else if(request.method == "GET"){
        return fetch(createGetURL(request), {
            method: request.method
        })
        .then(function (response) {
            if (response) {
                if (!response.ok || response.status != 200) {
                    throw new Error("Issue with sending from " + response.url + "   Status:" + response.status);
                }
                return response.json(); // Assumes JSON Response
            } else {
                throw new Error("Did not get a response from " + request.url);
            }
        })
        .then((resp_json) =>{
            let resp_data: T;
            console.log("JSON");
            console.log(resp_json);
            if(transformFunc){
                resp_data = transformFunc(resp_json);
            }else{
                resp_data = resp_json;
            }
            console.log(resp_data);
            //setLoading(false);
            return resp_data;
        });
    }else{
        return new Promise(()=>{
            throw new Error("Method failed");
        });
    }
    /*
    .catch((err) => {
        //setError(err.message);
        //setLoading(false);
        console.error(err);
    });*/
}


export function useFetch<T>(request: RequestData, transformFunc?: (jsonObj: Record<any, any>) => T): FetchResponse<T>{
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    let crsf_token = getCookies(cookie_key.csrf_token);
    useEffect(() => {
        /*
        fetch(request.url, {
            method: request.method,
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers : {
                'Content-Type': 'application/json',
                'X-CSRFToken': crsf_token
            },
            body: JSON.stringify(request.data)

        })
        .then(function (response) {
            if (response) {
                if (!response.ok || response.status != 200) {
                    throw new Error("Issue with sending from " + response.url + "   Status:" + response.status);
                }
                return response.json(); // Assumes JSON Response
            } else {
                throw new Error("Did not get a response from " + request.url);
            }
        })
        */
        getFetch<T>(request, transformFunc)
        .catch((err) => {
            setError(err.message);
            setLoading(false);
        })
        .then((data) =>{
            if(data){
                setData(data);
                setLoading(false);
            }else{
                throw new DataError("Fetch: Data was not good: " + typeof(data) + " " + data);
            }
        })
        .catch((err) => {
            setError(err.message);
            setLoading(false);
        });
        
    }, []);
    return {data: data, error: error, loading: loading};
}

export interface WordListResponse{
    words: [string, string|null][];
}