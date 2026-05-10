type Meta = Record<string, unknown>;

function format(scope: string, msg: string): string {
  return `[${scope}] ${msg}`;
}

export const log = {
  info(scope: string, msg: string, meta?: Meta): void {
    if (meta) console.log(format(scope, msg), meta);
    else console.log(format(scope, msg));
  },
  warn(scope: string, msg: string, meta?: Meta): void {
    if (meta) console.warn(format(scope, msg), meta);
    else console.warn(format(scope, msg));
  },
  error(scope: string, msg: string, err?: unknown, meta?: Meta): void {
    if (err !== undefined && meta) console.error(format(scope, msg), err, meta);
    else if (err !== undefined) console.error(format(scope, msg), err);
    else if (meta) console.error(format(scope, msg), meta);
    else console.error(format(scope, msg));
  },
};
