import {
  extism_input_length,
  extism_input_load_u8,
  extism_input_load_u64,
  extism_length,
  extism_alloc,
  extism_free,
  extism_output_set,
  extism_error_set,
  extism_config_get,
  extism_var_get,
  extism_var_set,
  extism_store_u8,
  extism_load_u8,
  extism_store_u64,
  extism_load_u64,
  extism_http_request,
  extism_log_debug,
  extism_log_error,
  extism_log_info,
  extism_log_warn,
} from './env'

export class Var {
  public static getMemory(key: string): Memory | null {
    const mem = Memory.allocateString(key)
    const offset = extism_var_get(mem.offset)
    if (offset == 0) {
      return null;
    }

    const length = extism_length(offset)
    if (length == 0) {
      return null;
    }

    return new Memory(offset, length);
  }
  
  public static get(key: string): Uint8Array | null {
    const x = Var.getMemory(key);
    if (x === null){
      return null;  
    }  
    
    return x.toUint8Array();
  }
  
  
  public static getString(key: string): string | null {
    const x = Var.getMemory(key);
    if (x === null){
      return null;  
    }  
    
    return x.toString();
  }

  public static set(key: string, value: Uint8Array): void {
    const keyMem = Memory.allocateString(key)
    const valMem = Memory.allocateBytes(value)

    extism_var_set(keyMem.offset, valMem.offset)
  }

  public static remove(key: string): void {
    const mem = Memory.allocateString(key)
    extism_var_set(mem.offset, 0)
  }
}

export class Memory {
  public offset: u64
  public length: u64

  constructor(offset: u64, length: u64) {
    this.offset = offset
    this.length = length
  }

  public load(buffer: Uint8Array): void {
    load(this.offset, buffer)
  }

  public store(data: Uint8Array): void {
    store(this.offset, data)
  }

  public free(): void {
    extism_free(this.offset)
  }
  
  
  public static allocate(length: u64): Memory {
    return new Memory(extism_alloc(length), length)
  }

  public static allocateBytes(data: Uint8Array): Memory {
    const length = data.length
    const offset = extism_alloc(length)
    for (let i = 0; i < length; i++) {
      extism_store_u8(offset + i, data[i])
    }

    return new Memory(offset, length)
  }

  public static allocateString(data: string): Memory {
    const buf = String.UTF8.encode(data)
    const bytes = Uint8Array.wrap(buf)

    return Memory.allocateBytes(bytes)
  }
  
  public toString(): string {
    let buffer: ArrayBuffer = new ArrayBuffer(u32(this.length));
    let value: Uint8Array = Uint8Array.wrap(buffer)
    load(this.offset, value);
    return String.UTF8.decode(buffer);
  }

  public toUint8Array(): Uint8Array {
    let buffer: ArrayBuffer = new ArrayBuffer(u32(this.length));
    let value: Uint8Array = Uint8Array.wrap(buffer)
    load(this.offset, value);
    return value;
  }
}

export enum LogLevel {
  Info,
  Warn,
  Debug,
  Error
}

export class Config {
  public static getMemory (key: string): Memory | null {
    const mem = Memory.allocateString(key)

    const offset = extism_config_get(mem.offset)
    if (offset == 0) {
      return null
    }

    const length = extism_length(offset)
    if (length == 0) {
      return null
    }

    return new Memory(offset, length);
  }
  
  public static get(key: string): string | null {
    const mem = Config.getMemory(key);
    if (mem === null){
      return null;  
    }
    return mem.toString();
  }
}

export class Host {
  public static input() : Uint8Array {
    let length = extism_input_length();
    let value = new Uint8Array(u32(length));
    let u64 = Uint64Array.wrap(value.buffer, 0, value.length / 8);
    for (var i = 0; i < value.length; i++) {
      if (value.length - i < 8) {
        value[i] = extism_input_load_u8(i);
        continue;
      }

      u64[i / 8] = extism_input_load_u64(i);
      i += 7;
    }
    return value;
  }

  public static inputString() : string {
    return String.UTF8.decode(Host.input().buffer);  
  }

  public static output(s: Uint8Array) : void {
    const length = s.length
    const offset = extism_alloc(length)
    store(offset, s)
    extism_output_set(offset, length)
  }

  public static outputMemory(s: Memory) : void {
    extism_output_set(s.offset, s.length)
  }

  public static outputString(s: string) : void {
    const length = s.length;
    const offset = extism_alloc(length)
    store(offset, Uint8Array.wrap(String.UTF8.encode(s)))
    extism_output_set(offset, length)
  }
  
  public static logMemory(level: LogLevel, memory: Memory): void {
    switch (level) {
      case LogLevel.Info:
        extism_log_info(memory.offset);
        break;
      case LogLevel.Debug:
        extism_log_debug(memory.offset);
        break;
      case LogLevel.Error:
        extism_log_error(memory.offset);
        break;
      case LogLevel.Warn:
        extism_log_warn(memory.offset);
        break;
    }
  }

  public static log(level: LogLevel, s: string): void {
    let mem = Memory.allocateString(s);
    this.logMemory(level, mem)
  }
}

function load(offset: u64, value: Uint8Array): void {
  let u64 = Uint64Array.wrap(value.buffer, 0, value.length / 8);
  for (var i = 0; i < value.length; i++) {
    if (value.length - i < 8) {
      value[i] = extism_load_u8(offset + i);
      continue;
    }

    u64[i / 8] = extism_load_u64(offset + i);
    i += 7;
  }
}

function store(offset: u64, value: Uint8Array): void {
  let u64 = Uint64Array.wrap(value.buffer, 0, value.length / 8);

  for (var i = 0; i < value.length; i++) {
    if (value.length - i < 8) {
      extism_store_u8(offset + i, value[i])
      continue;
    }

    extism_store_u64(offset + i, u64[i / 8]);
    i += 7;
  }
}
