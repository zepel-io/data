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
