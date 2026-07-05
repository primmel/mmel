import Process, { ResolvableProcess } from '../../types/process';
import { resolveFromContext } from '../resolve';
import { removePackage, tokenizePackage } from '../tokenize';
import { Dumper, Parser, Resolver } from '../types';

export const parseProcess: Parser = function (id, data) {
  const result: ResolvableProcess = {
    id: id,
    name: '',
    modality: '',
    actor: null,
    output: [],
    input: [],
    provision: [],
    page: null,
    measure: [],
    _relations: {
      actor: '',
      output: [],
      input: [],
      provision: [],
      page: '',
    },
  };

  if (data !== '') {
    const t: string[] = tokenizePackage(data);
    let i = 0;
    while (i < t.length) {
      const keyword: string = t[i++];
      if (i < t.length) {
        if (keyword === 'modality') {
          result.modality = t[i++];
        } else if (keyword === 'name') {
          result.name = removePackage(t[i++]);
        } else if (keyword === 'actor') {
          result._relations.actor = t[i++];
        } else if (keyword === 'subprocess') {
          result._relations.page = t[i++];
        } else if (keyword === 'validate_provision') {
          result._relations.provision = tokenizePackage(t[i++]);
        } else if (keyword === 'validate_measurement') {
          result.measure = tokenizePackage(t[i++]).flatMap(x =>
            removePackage(x)
          );
        } else if (keyword === 'output') {
          result._relations.output = tokenizePackage(t[i++]);
        } else if (keyword === 'reference_data_registry') {
          result._relations.input = tokenizePackage(t[i++]);
        } else {
          i++; // forward-compatible: skip unknown keyword value
        }
      } else {
        throw new Error(
          `Parsing error: process. ID ${id}: Expecting value for ${keyword}`
        );
      }
    }
  }
  return ctx => ({ ...ctx, processes: { ...ctx.processes, [id]: result } });
};

export const resolveProcess: Resolver<Process, ResolvableProcess> = function (
  ctx,
  unresolved
) {
  const p = { ...unresolved };
  for (const id of unresolved._relations.output) {
    p.output.push(resolveFromContext(ctx, 'registers', id));
  }
  for (const id of unresolved._relations.input) {
    p.input.push(resolveFromContext(ctx, 'registers', id));
  }
  for (const id of unresolved._relations.provision) {
    p.provision.push(resolveFromContext(ctx, 'provisions', id));
  }
  if (unresolved._relations.actor !== '') {
    p.actor = resolveFromContext(ctx, 'roles', unresolved._relations.actor);
  }
  if (unresolved._relations.page !== '') {
    p.page = resolveFromContext(ctx, 'pages', unresolved._relations.page);
  }
  return p;
};

export const dumpProcess: Dumper<Process> = function (process) {
  let out: string = 'process ' + process.id + ' {\n';
  out += '  name "' + process.name + '"\n';
  if (process.actor !== null) {
    out += '  actor ' + process.actor.id + '\n';
  }
  if (process.modality !== '') {
    out += '  modality ' + process.modality + '\n';
  }
  if (process.input.length > 0) {
    out += '  reference_data_registry {\n';
    for (const dr of process.input) {
      out += '    ' + dr.id + '\n';
    }
    out += '  }\n';
  }
  if (process.provision.length > 0) {
    out += '  validate_provision {\n';
    for (const r of process.provision) {
      out += '    ' + r.id + '\n';
    }
    out += '  }\n';
  }
  if (process.measure.length > 0) {
    out += '  validate_measurement {\n';
    for (const v of process.measure) {
      out += '    "' + v + '"\n';
    }
    out += '  }\n';
  }
  if (process.output.length > 0) {
    out += '  output {\n';
    for (const c of process.output) {
      out += '    ' + c.id + '\n';
    }
    out += '  }\n';
  }
  if (process.page !== null) {
    out += '  subprocess ' + process.page.id + '\n';
  }
  out += '}\n';
  return out;
};
