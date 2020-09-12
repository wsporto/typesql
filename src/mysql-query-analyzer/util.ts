export type ParamIndexes = {
    paramName: string;
    indexes: number[];
}

export function getParameterIndexes(namedParameters: string[]) : ParamIndexes[] {
    const hashMap: Map<string, number[]> = new Map();
    namedParameters.forEach( (param, index) => {
        if(hashMap.has(param)) {
            hashMap.get(param)!.push(index);
        }
        else {
            hashMap.set(param, [index]);
        }
    });

    const paramIndex = Array.from(hashMap.keys())
        .map( paramName => {
            const paramIndexes: ParamIndexes = {
                paramName,
                indexes: hashMap.get(paramName)!
            }
            return paramIndexes;
        })

    return paramIndex;
}

export function getPairWise(indexes: number[], func: (cur:number, next: number) => void) {
    for(var i=0; i < indexes.length - 1; i++){
        func(indexes[i], indexes[i + 1])
    }
}