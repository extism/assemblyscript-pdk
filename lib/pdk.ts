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

  get(key: string): Uint8Array {
    const mem = this.host.allocateString(key)
    const offset = extism_var_get(mem.offset)
    if (offset == 0) {
      return new Uint8Array(0)
    }

    const length = extism_length(offset)
    if (length == 0) {
      return new Uint8Array(0)
    }

    let value: Uint8Array = new Uint8Array(u32(length))
    load(offset, value)

    return value
  }

  set(key: string, value: Uint8Array): void {
    const keyMem = this.host.allocateString(key)
    const valMem = this.host.allocateBytes(value)

    extism_var_set(keyMem.offset, valMem.offset)
  }

  remove(key: string): void {
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

  load(buffer: Uint8Array): void {
    load(this.offset, buffer)
  }

  store(data: Uint8Array): void {
    store(this.offset, data)
  }

  free(): void {
    extism_free(this.offset)
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

  input(): Array<u8> {
    let dest = new Array<u8>(u32(this.input_length))

    for (let i = u32(0); i < u32(this.input_length); i++) {
      dest[i] = u8(extism_load_u8(u32(this.input_offset) + i))
    }

    return dest
  }

  inputString(): string {
    return String.fromCharCodes(
      this.input().map<i32>((value, _index, _self) => i32(value))
    )
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

  config(key: string): string {
    const mem = this.allocateString(key)

    const offset = extism_config_get(mem.offset)
    if (offset == 0) {
      return ""
    }

    const length = extism_length(offset)
    if (length == 0) {
      return ""
    }

    let buffer: ArrayBuffer = new ArrayBuffer(u32(length));
    let value: Uint8Array = Uint8Array.wrap(buffer)
    load(offset, value)
    return String.UTF8.decode(buffer)
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