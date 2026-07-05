import Standard from '../types/Standard';
import { dumpMetadata } from './config/metadata';
import { DumperConfiguration } from './types';

export default function dump(
  model: Standard,
  dumpers: DumperConfiguration
): string {
  let out = '';

  if (model.root !== null) {
    out += 'root ' + model.root.id + '\n\n';
  }

  out += dumpMetadata(model.meta) + '\n';

  for (const [field, dumper] of Object.entries(dumpers)) {
    out += dumper(model[field]) + '\n';
  }
  return out;
}
