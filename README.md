# DetectTor

<img alt="DetectTor Logo" src="https://github.com/user-attachments/assets/73719a06-9b2a-4f81-a900-3214a7208739" for="cover" width="256" />

DetectTor is a simple npm library to detect if a request originated from Tor Browser.
DetectTor uses Tor's exit node list to determine if the request is a Tor exit node.

## Usage

Install the package:

```bash
npm install @bestcodes/detecttor
```

Import and use a function:

```typescript
import isIpTor, { amIUsingTor } from "@bestcodes/detecttor";

isIpTor("89.0.142.86")
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
  });

amIUsingTor()
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
  });
```

## License

MIT License
