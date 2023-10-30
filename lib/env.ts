@external("extism:host/env", "input_length")
export declare function input_length(): u64;
@external("extism:host/env", "input_load_u8")
export declare function input_load_u8(offs: u64): u8;
@external("extism:host/env", "input_load_u64")
export declare function input_load_u64(offs: u64): u64;
@external("extism:host/env", "length")
export declare function length(a: u64): u64;
@external("extism:host/env", "alloc")
export declare function alloc(a: u64): u64;
@external("extism:host/env", "free")
export declare function free(a: u64): void;
@external("extism:host/env", "output_set")
export declare function output_set(a: u64, b: u64): void;
@external("extism:host/env", "error_set")
export declare function error_set(a: u64): void;
@external("extism:host/env", "config_get")
export declare function config_get(a: u64): u64;
@external("extism:host/env", "var_get")
export declare function var_get(a: u64): u64;
@external("extism:host/env", "var_set")
export declare function var_set(a: u64, b: u64): void;
@external("extism:host/env", "store_u8")
export declare function store_u8(a: u64, b: u8): void;
@external("extism:host/env", "load_u8")
export declare function load_u8(a: u64): u8;
@external("extism:host/env", "store_u64")
export declare function store_u64(a: u64, b: u64): void;
@external("extism:host/env", "load_u64")
export declare function load_u64(a: u64): u64;
@external("extism:host/env", "http_request")
export declare function http_request(a: u64, b: u64): u64;
@external("extism:host/env", "log_warn")
export declare function log_warn(offs: u64): void;
@external("extism:host/env", "log_info")
export declare function log_info(offs: u64): void;
@external("extism:host/env", "log_debug")
export declare function log_debug(offs: u64): void;
@external("extism:host/env", "log_error")
export declare function log_error(offs: u64): void;
