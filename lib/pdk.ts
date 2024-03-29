import {
  alloc,
  config_get,
  error_set,
  free,
  http_request,
  input_length,
  input_load_u64,
  input_load_u8,
  length,
  load_u64,
  load_u8,
  log_debug,
  log_error,
  log_info,
  log_warn,
  output_set,
  store_u64,
  store_u8,
  var_get,
  var_set,
} from "./env";

export class Var {
  public static getMemory(key: string): Memory | null {
    const mem = Memory.allocateString(key);
    const offset = var_get(mem.offset);
    if (offset == 0) {
      return null;
    }

    const l = length(offset);
    if (l == 0) {
      return null;
    }

    return new Memory(offset, l);
  }

  public static get(key: string): Uint8Array | null {
    const x = Var.getMemory(key);
    if (x === null) {
      return null;
    }

    return x.toUint8Array();
  }

  public static getString(key: string): string | null {
    const x = Var.getMemory(key);
    if (x === null) {
      return null;
    }

    return x.toString();
  }

  public static set(key: string, value: Uint8Array): void {
    const keyMem = Memory.allocateString(key);
    const valMem = Memory.allocateBytes(value);

    var_set(keyMem.offset, valMem.offset);
  }

  public static remove(key: string): void {
    const mem = Memory.allocateString(key);
    var_set(mem.offset, 0);
  }
}

export class Memory {
  public offset: u64;
  public length: u64;

  constructor(offset: u64, length: u64) {
    this.offset = offset;
    this.length = length;
  }

  public load(buffer: Uint8Array): void {
    load(this.offset, buffer);
  }

  public store(data: Uint8Array): void {
    store(this.offset, data);
  }

  public free(): void {
    free(this.offset);
  }

  public static allocate(length: u64): Memory {
    return new Memory(alloc(length), length);
  }

  public static allocateBytes(data: Uint8Array): Memory {
    const length = data.length;
    const offset = alloc(length);
    for (let i = 0; i < length; i++) {
      store_u8(offset + i, data[i]);
    }

    return new Memory(offset, length);
  }

  public static allocateString(data: string): Memory {
    const buf = String.UTF8.encode(data);
    const bytes = Uint8Array.wrap(buf);

    return Memory.allocateBytes(bytes);
  }

  public toString(): string {
    let buffer: ArrayBuffer = new ArrayBuffer(u32(this.length));
    let value: Uint8Array = Uint8Array.wrap(buffer);
    load(this.offset, value);
    return String.UTF8.decode(buffer);
  }

  public toUint8Array(): Uint8Array {
    let buffer: ArrayBuffer = new ArrayBuffer(u32(this.length));
    let value: Uint8Array = Uint8Array.wrap(buffer);
    load(this.offset, value);
    return value;
  }
}

export enum LogLevel {
  Info,
  Warn,
  Debug,
  Error,
}

export class Config {
  public static getMemory(key: string): Memory | null {
    const mem = Memory.allocateString(key);

    const offset = config_get(mem.offset);
    if (offset == 0) {
      return null;
    }

    const l = length(offset);
    if (l == 0) {
      return null;
    }

    return new Memory(offset, l);
  }

  public static get(key: string): string | null {
    const mem = Config.getMemory(key);
    if (mem === null) {
      return null;
    }
    return mem.toString();
  }
}

export class Host {
  public static input(): Uint8Array {
    let length = input_length();
    let value = new Uint8Array(u32(length));
    let u64 = Uint64Array.wrap(value.buffer, 0, value.length / 8);
    for (var i = 0; i < value.length; i++) {
      if (value.length - i < 8) {
        value[i] = input_load_u8(i);
        continue;
      }

      u64[i / 8] = input_load_u64(i);
      i += 7;
    }
    return value;
  }

  public static inputString(): string {
    return String.UTF8.decode(Host.input().buffer);
  }

  public static output(s: Uint8Array): void {
    const length = s.length;
    const offset = alloc(length);
    store(offset, s);
    output_set(offset, length);
  }

  public static outputMemory(s: Memory): void {
    output_set(s.offset, s.length);
  }

  public static outputString(s: string): void {
    const length = s.length;
    const offset = alloc(length);
    store(offset, Uint8Array.wrap(String.UTF8.encode(s)));
    output_set(offset, length);
  }

  public static logMemory(level: LogLevel, memory: Memory): void {
    switch (level) {
      case LogLevel.Info:
        log_info(memory.offset);
        break;
      case LogLevel.Debug:
        log_debug(memory.offset);
        break;
      case LogLevel.Error:
        log_error(memory.offset);
        break;
      case LogLevel.Warn:
        log_warn(memory.offset);
        break;
    }
  }

  public static log(level: LogLevel, s: string): void {
    let mem = Memory.allocateString(s);
    this.logMemory(level, mem);
  }
}

function load(offset: u64, value: Uint8Array): void {
  let u64 = Uint64Array.wrap(value.buffer, 0, value.length / 8);
  for (var i = 0; i < value.length; i++) {
    if (value.length - i < 8) {
      value[i] = load_u8(offset + i);
      continue;
    }

    u64[i / 8] = load_u64(offset + i);
    i += 7;
  }
}

function store(offset: u64, value: Uint8Array): void {
  let u64 = Uint64Array.wrap(value.buffer, 0, value.length / 8);

  for (var i = 0; i < value.length; i++) {
    if (value.length - i < 8) {
      store_u8(offset + i, value[i]);
      continue;
    }

    store_u64(offset + i, u64[i / 8]);
    i += 7;
  }
}
