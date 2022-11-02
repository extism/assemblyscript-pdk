import { Var, Config, Host } from './lib/pdk';

function myAbort(
  message: string | null,
  fileName: string | null,
  lineNumber: u32,
  columnNumber: u32
): void { }


export function count_vowels(): i32 {
  let str = Host.inputString();
  var count = 0;
  for (var i = 0; i < str.length; i++) {
    let x: string = str[i];
    if (x == 'a' || x == 'A' ||
      x == 'e' || x == 'E' ||
      x == 'i' || x == 'I' ||
      x == 'o' || x == 'O' ||
      x == 'u' || x == 'U') {
      count += 1;
    }
  }

  // test some host functionality
  var a = Uint8Array.wrap(String.UTF8.encode("this is var a"))
  Var.set('a', a);
  const thing = Config.get("thing");
  let data = Var.get('a');
  let var_a = (data == null) ? "null" : String.UTF8.decode(data.buffer);

  var out = '{"count": ' + count.toString() + ', "config": "' + (thing == null ? "null" : thing) + '", "a": "' + var_a + '"}';
  Host.outputString(out);
  Var.remove('a');

  return 0;
}
