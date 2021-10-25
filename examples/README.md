# Sample code #1

1. prepare a configuration file `.enlite.json` at your project root:
```json
{
  "wsun": {
    "adaptor": "YOUR_ADAPTOR",
    "id": {
      "id": "YOUR_ID",
      "password": "YOUR_PASSWORD"
    },
    "config": {
      "device": "/dev/tty.usbserial"
    }
  }
}
```
1. run `example1.ts`
```
./node_module/.bin/ts-node examples/example1.ts
```
