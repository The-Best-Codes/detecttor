import { amIUsingTor } from "../dist/esm/index.js";

amIUsingTor()
    .then((result) => {
        console.log(result);
    })
    .catch((error) => {
        console.error(error);
    })