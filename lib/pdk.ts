import {
  extism_input_offset,
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
  extism_store_u32,
  extism_load_u32,
  extism_store_u64,
  extism_load_u64,
  extism_http_request
} from './env'

export class Variables {
  host: Host

  constructor(host: Host) {
    this.host = host
  }

  public get(key: string): Pointer<Uint8Array> | null {
    const mem = this.host.allocateString(key)
    const offset = extism_var_get(mem.offset)
    if (offset == 0) {
      return null;
    }

    const length = extism_length(offset)
    if (length == 0) {
      return null;
    }

    return Pointer.uint8Array(new Memory(offset, length));
  }

  public set(key: string, value: Uint8Array): void {
    const keyMem = this.host.allocateString(key)
    const valMem = this.host.allocateBytes(value)

    extism_var_set(keyMem.offset, valMem.offset)
  }

  public remove(key: string): void {
    const mem = this.host.allocateString(key)
    extism_var_set(mem.offset, 0)
  }
}

export class Memory {
  offset: u64
  length: u64

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
}

export class Pointer<T> {
  public value: T
  public memory: Memory

  public constructor(value: T, memory: Memory) {
    this.value = value;
    this.memory = memory;
  }

  static string(memory: Memory): Pointer<string> {
    let buffer: ArrayBuffer = new ArrayBuffer(u32(memory.length));
    let value: Uint8Array = Uint8Array.wrap(buffer)
    load(memory.offset, value)
    return new Pointer(String.UTF8.decode(buffer), memory);
  }

  static uint8Array(memory: Memory): Pointer<Uint8Array> {
    let buffer: ArrayBuffer = new ArrayBuffer(u32(memory.length));
    let value: Uint8Array = Uint8Array.wrap(buffer)
    load(memory.offset, value)
    return new Pointer(value, memory);
  }
}

export class Host {
  input_offset: u64
  input_length: u64

  constructor() {
    this.input_offset = extism_input_offset()
    this.input_length = extism_length(this.input_offset)
  }

  allocate(length: u64): Memory {
    return new Memory(extism_alloc(length), length)
  }

  allocateBytes(data: Uint8Array): Memory {
    const length = data.length
    const offset = extism_alloc(length)
    for (let i = 0; i < length; i++) {
      extism_store_u8(offset + i, data[i])
    }

    return new Memory(offset, length)
  }

  allocateString(data: string): Memory {
    const buf = String.UTF8.encode(data)
    const bytes = Uint8Array.wrap(buf)

    return this.allocateBytes(bytes)
  }

  input(): Uint8Array {
    let bytes = new Uint8Array(i32(this.input_length));

    for (let i = u32(0); i < u32(this.input_length); i++) {
      bytes[i] = u8(extism_load_u8(u32(this.input_offset) + i))
    }

    return bytes
  }

  inputString(): string {
    return String.UTF8.decode(this.input().buffer)
  }

  outputString(s: string): void {
    const length = s.length;
    const offset = extism_alloc(length)
    store(offset, Uint8Array.wrap(String.UTF8.encode(s)))
    extism_output_set(offset, length)
  }

  output(s: Uint8Array): void {
    const length = s.length
    const offset = extism_alloc(length)
    store(offset, s)
    extism_output_set(offset, length)
  }


  outputMemory(m: Memory): void {
    extism_output_set(m.offset, m.length)
  }

  config(key: string): Pointer<string> | null {
    const mem = this.allocateString(key)

    const offset = extism_config_get(mem.offset)
    if (offset == 0) {
      return null
    }

    const length = extism_length(offset)
    if (length == 0) {
      return null
    }

    return Pointer.string(new Memory(offset, length));
  }

  vars(): Variables {
    return new Variables(this)
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