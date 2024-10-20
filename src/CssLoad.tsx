import { ReactElement } from 'react';
import { FetchResponse, useFetch } from './utils/fetch_utils';
import { isDictionary } from './utils/type_utils';

interface CssResponse{
    path: string;
  }

export function CssLoad(props: {domain_str: string}){

    const css_url: string = "/api/css/";

    const params_record: Record<string, string| null> = {
        "domain": props.domain_str == null ? "": props.domain_str
    }

    const response: FetchResponse<CssResponse> = useFetch<CssResponse>({
        url: css_url,
        method: "GET",
        data: params_record
    });

    if(response.loading){
        return (
          <div>
            <p>
              Data is Loading...
            </p>
          </div>
        );
      }else if(response.error != null){
        return (
          <div>
              <p>Response Error</p>
              <p>{response.error}</p>
          </div>
        );
      }else if(response.data != null){
        if(isDictionary(response.data, ["path"])){
            return (
                <link rel="stylesheet" href={response.data.path}/>
            );
        }else{
            return (
                <div><p>Can Not load</p></div>
            );
        }
      }else{
        return (<div><h1 className="errorText">No Game Modes Are Currently Available</h1></div>);
      }
}