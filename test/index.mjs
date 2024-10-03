import isIpTor, { amIUsingTor } from "../dist/esm/index.js";

amIUsingTor()
    .then((result) => {
        console.log(result);
    })
    .catch((error) => {
        console.error(error);
    })

isIpTor("89.0.142.86")
    .then((result) => {
        console.log(result);
    })
    .catch((error) => {
        console.error(error);
    })