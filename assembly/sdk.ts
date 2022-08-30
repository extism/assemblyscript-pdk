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

  get(key: string): Array<u8> {
    const mem = this.host.allocateBytes(stringToBytes(key))
    const offset = extism_var_get(mem.offset)
    const length = extism_length(offset)
    if (offset == 0 || length == 0) {
      return new Array(0)
    }

    let value: Array<u8> = new Array(u32(length))
    load(offset, value)

    return value
  }

  set(key: string, value: Array<u8>): void {
    const keyMem = this.host.allocateBytes(stringToBytes(key))
    const valMem = this.host.allocate(value.length)

    extism_var_set(keyMem.offset, valMem.offset)
  }

  remove(key: string): void {
    const mem = this.host.allocateBytes(stringToBytes(key))
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

  load(buffer: Array<u8>): void {
    load(this.offset, buffer)
  }

  store(data: Array<u8>): void {
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

  allocateBytes(data: Array<u8>): Memory {
    const length = data.length
    const offset = extism_alloc(length)
    for (let i = 0; i < length; i++) {
      extism_store_u8(offset + i, data[i])
    }

    return new Memory(offset, length)
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
    );
  }

  outputString(s: string): void {
    const length = s.length;
    const offset = extism_alloc(length)
    store(offset, stringToBytes(s))
    extism_output_set(offset, length);
  }

  output(s: Array<u8>): void {
    const length = s.length
    const offset = extism_alloc(length)
    store(offset, s)
    extism_output_set(offset, length)
  }

  config(key: string): string {
    const bytes = stringToBytes(key)
    const mem = this.allocateBytes(bytes)

    const offset = extism_config_get(mem.offset)
    const length = extism_length(offset)
    if (offset == 0 || length == 0) {
      return ""
    }

    let value: Array<u8> = new Array(u32(length))
    load(offset, value)

    return value.toString()
  }

  vars(): Variables {
    return new Variables(this)
  }
}

function stringToBytes(s: string): Array<u8> {
  const bytes: Array<u8> = new Array(s.length)
  for (let i = 0; i < s.length; i++) {
    bytes[i] = u8(s.charCodeAt(i))
  }

  return bytes
}

function load(offset: u64, value: Array<u8>): void {
  for (let i = 0; i < value.length; i++) {
    value[i] = extism_load_u8(offset + i)
  }
}

function store(offset: u64, value: Array<u8>): void {
  for (let i = 0; i < value.length; i++) {
    extism_store_u8(offset + i, value[i])
  }
}