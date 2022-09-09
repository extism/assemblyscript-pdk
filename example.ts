import { Host } from './lib/pdk';

function myAbort(
  message: string | null,
  fileName: string | null,
  lineNumber: u32,
  columnNumber: u32
): void { }


export function count_vowels(): i32 {
  let host = new Host();
  let str = host.inputString();
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
  const vars = host.vars()

  var a = Uint8Array.wrap(String.UTF8.encode("this is var a"))
  // vars.set('a', a);
  const thing = host.config("thing");
  const data = vars.get('a');

  var out = '{"count": ' + count.toString() + ', "config": "' + thing + '"}';
  host.outputString(out);

  vars.remove('a');

  return 0;
}
