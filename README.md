# Axios PhraseApp

Axios middleware/interceptor that helps to guard a bit against PhraseApp rate limiting. Highly configurable

## Installation

```bash
npm install axios-phraseapp
```

### Note :rotating_light:

Not working with `axios 0.19.0` (_As most other libraries_). For details see the [bug](https://github.com/axios/axios/issues/2203). [`axios 0.19.1`](https://github.com/axios/axios/releases/tag/0.19.1) has fixed this bug.

## Usage

The simple, **no configuration** behaviour of `axios-phraseapp` is to add a `phraseApp` property on the request/response configuration of axios requests.

```js
const { config } = await axios.get(PHRASEAPP_REQUEST);
console.log(config.phraseApp); /** Access to the phraseApp property */
```

This `phraseApp` property has following structure that you can extract information returned from the PhraseApp API calls and even add your own logic on top of them.

```js
{
  moduleConfig : {}, /** Module configuration */

  state: {
    /** Number of in-flight requests */
    inFlightRequests: 0,

    /** Remaining requests until limit is reached for this time slice */
    remaining: null,

    /** Unix Epoch value to time reset */
    reset: null,

    /** PhraseApp request limit */
    limit: null,

    /** JavaScript Date object from the `reset` time */
    resetDate: null,

    /** Signifies if the `axios-phraseapp` functions are active */
    started: false
  }
}
```

### Importing

```js
// CommonJS
const { attach, detach } = require("axios-phraseapp");

// ESM
import { attach, detach } from "axios-phraseapp";

// You can also consider renaming, something like:
import {
  attach as phraseAppAttach,
  detach as phraseAppDetach
} from "axios-phraseapp";
```

### Attaching

```typescript
attach( [ AxiosInstance|AxiosStatic ], [ AxiosPhraseAppConfig ] ) : Array<InterceptorId, InterceptorId>
```

The `attach` method, registers the request interceptors on either an `axios` [instance](https://github.com/axios/axios#creating-an-instance) or the main imported `axios` object by default.

```js
/** Implicit */
import axios from "axios";
attach(axios);

/** Explicit */
import axios from "axios";
attach(); // Assumes axios peer dependency

/** Specific instance */
import axios from "axios";
const axiosInstance = axios.create({});
attach(axiosInstance);
```

\* The return value of the `attach` method, is an array `<InterceptorId, InterceptorId>` that can be then passed **as it is** to `detach` and remove the interceptors.

### Detaching

To remove the `axios-phraseapp` interceptors you can use the `detach` method.

```js
/** Implicit */
import axios from "axios";
const interceptorIds = attach(axios);
detach(axios, interceptorIds);

/** Specific instance */
import axios from "axios";
const axiosInstance = axios.create({});
const interceptorIds = attach(axiosInstance);
detach(axiosInstance, interceptorIds);
```

### Configuration

The second argument to the `attach` method, can take a custom configuration object, or uses some non-intrusive defaults.

```typescript
{
  /**
   * Will cancel with Axios.Cancel() when no more quota are available
   * until the next reset time.
   *
   * Defaults to false
   */
  cancelOnQuota?: boolean;

  /**
   * Will log when in the zone of either a percentage or
   * limit number of remaining requests.
   *
   * You can either pass a number e.g. 200 or certain percentage
   * e.g. 1 / 5 which is the same as 0.2 .
   *
   * Every time that a request is in this zone, the `logFunction`
   * will be triggered on request. Logging will be done
   * using `logFunction` parameter.
   *
   * Defaults to -1, which means it will not log.
   */
  logOnLimit?: number;

  /**
   * Method to log `logOnLimit` with.
   * Defaults to `console.log`.
   */
  logFunction?: function;
}
```

## Next Steps

- [ ] Examples folder
- [ ] Full usage typings
- [ ] More badges
- [ ] Strategies for canceling befora quota is reached

## License

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

refer to `LICENSE` file in this repository.

---

:exclamation: This repository is in no way affiliated with [PhraseApp](https://phrase.com/)
