import InternalModel from './model/internal-model';
import { RecordData } from '..';
export interface RecordIdentifier {
    type: string;
    id: string | null;
    lid: string;
}

let lid = 1;
export function identifierForIM(im: InternalModel): RecordIdentifier {
    return identifierForRD(im._recordData);
}

// TODO 
export function identifierForModel(model): RecordIdentifier  {
    return identifierForRD((model._internalModel && model._internalModel._recordData) || model._recordData);
}

export function identifierForRD(rd: RecordData): RecordIdentifier {
    if (!rd.__clientId) {
        rd.__clientId = rd.clientId || '' + lid;
        lid++;
    }
    return {
        type: rd.modelName,
        id: rd.id,
        lid: rd.__clientId
    }
}