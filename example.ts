import { Host } from './assembly/sdk';

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
  host.config('none')
  const vars = host.vars()
  var a = new Uint8Array(4);
  a.set([65, 65, 65, 65]);
  vars.set('a', a);
  const data = vars.get('a')
  vars.remove('a');

  var out = '{"count": ' + count.toString() + ', "a": ' + data.toString() + '}';
  host.outputString(out);

  return 0;
}
