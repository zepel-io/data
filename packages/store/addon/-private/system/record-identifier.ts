import InternalModel from './model/internal-model';
import { RecordData } from '..';
export interface RecordIdentifier {
  type: string;
  id: string | null;
  lid: string;
}

let typeIdMap = {};
let lid = 1;
export function identifierForIM(im: InternalModel): RecordIdentifier {
  return im.identifier;
}

// TODO
export function identifierForModel(model): RecordIdentifier {
  return model._internalModel.identifier;
}

export function identifierForRD(rd: RecordData, type?: string): RecordIdentifier {
  debugger;
  if (!rd.__clientId) {
    rd.__clientId = rd.clientId || '' + lid;
    lid++;
  }
  let modelName = type || rd.modelName;
  let identifier = {
    type: modelName,
    id: rd.id,
    lid: rd.__clientId,
  };

  if (rd.id) {
    typeIdMap[modelName + rd.id] = identifier;
  }
  return identifier;
}

export function identifierForTypeId(modelName, id): RecordIdentifier {
  return typeIdMap[modelName + id];
}
