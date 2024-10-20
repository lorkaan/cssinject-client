
export function isDictionary(val: any, keys: string[] = []){
    if(typeof(val) == 'object' && Object.keys(val).length > 0){
        if(keys.length > 0){
            let key_set = new Set(Object.keys(val));
            for(let i = 0; i < keys.length; i++){
                if(key_set.has(keys[i])){
                    continue;
                }else{
                    return false;
                }
            }
            return true;
        }else{
            return true;
        }
    }else{
        return false;
    }
}