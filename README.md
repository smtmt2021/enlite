[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/smtmt2021/enlite/actions/workflows/node.js.yml/badge.svg)](https://github.com/smtmt2021/enlite/actions/workflows/node.js.yml)
[![Node.js Package](https://github.com/smtmt2021/enlite/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/smtmt2021/enlite/actions/workflows/npm-publish.yml)
# Enlite for smart meter

```
+-------------------------------------------+
|                 Your Apps                 |
+-------------------------------------------+
|               >>> Enlite <<<              |
+-------------------------------------------+
|           WSUN Adaptor Interface          |
+-------------------------------------------+
|                          |  UDP  |  PANA  |
|        WSUN Adaptor      | IPv6 / 6LoWPAN |
|                          |  IEEE802.15.4  |
+-------------------------------------------+
                       :
+-------------------------------------------+
|         A smart meter of your home        |
+-------------------------------------------+
```

## Usage

* Here is a very brief code:
```typescript
import { EnliteGetInstance, SmartElectricEnergyMeter, CLASS } from 'enlite';
// write your own app
class MySmartMeter extends SmartElectricEnergyMeter {
  startPolling() {
    this.timer = setInterval(async () => {
      const watt = await this.getInstantaneousElectricEnergey();
      console.log(`${watt}W`);
    }, 60 * 1000);
  }
}
// get a framework which is provided by this project
const enlite = EnliteGetInstance();
// register the app you wrote above
enlite.addDeviceClass(CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER, MySmartMeter);
// prepare code to activate measuring
enlite.once('device-created', device => {
  // start polling to get a current value of your smart meter
  device.startPolling();
});
// let's go
enlite.open();
```
* see the [concrete examples (./examples)](./examples/README.md) as well.

## Test

- `npm test`
- then, open `./coverage/lcov-report/index.html` to see the coverage.

## Debug

- Specify following environment variables (e.g. `export DEBUG=enlite/enlite`)
to display debug information;

File or module                    | Environment variable
----------------------------------|---------------------
`src/enlite-impl.ts`              | `enlite/enlite`
`src/nodeprofile.ts`              | `enlite/nodeprofile`
`src/controller.ts`               | `enlite/controller`
`src/device.ts`                   | `enlite/device`
`src/node.ts`                     | `enlite/node`
`wsun-adaptor`                    | `wsun/adaptor`, `wsun/socket`

## License
- MIT license
- Copyright (c) 2021 KINOSHITA minoru, All Rights Reserved.
