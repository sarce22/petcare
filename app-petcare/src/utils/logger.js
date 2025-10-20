const LEVELS = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  success: 'SUCCESS',
  debug: 'DEBUG'
};

function formatMeta(meta) {
  if (meta == null) {
    return '';
  }

  const serialized = typeof meta === 'string' ? meta : JSON.stringify(meta, null, 2);
  return `\n    -> ${serialized.split('\n').join('\n    -> ')}`;
}

function formatLine(level, message, meta) {
  const timestamp = new Date().toISOString();
  const header = `${timestamp} │ ${LEVELS[level] ?? level.toUpperCase()}`.padEnd(32, ' ');
  return `${header}│ ${message}${formatMeta(meta)}`;
}

export function info(message, meta) {
  console.log(formatLine('info', message, meta));
}

export function warn(message, meta) {
  console.warn(formatLine('warn', message, meta));
}

export function error(message, meta) {
  console.error(formatLine('error', message, meta));
}

export function success(message, meta) {
  console.log(formatLine('success', message, meta));
}

export function debug(message, meta) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.log(formatLine('debug', message, meta));
}

export function banner(message) {
  const line = '='.repeat(message.length + 8);
  console.log(line);
  console.log(`==  ${message}  ==`);
  console.log(line);
}
