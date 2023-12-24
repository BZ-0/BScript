import IW from "src/index.mjs";
//import JSOX from "jsox";

//
//import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

//
class Husband {
    constructor() {
        this.role = "husband";
        this.age = 45;
    }
};

//
class Brother {
    constructor() {
        this.role = "brother";
        this.age = 37;
    }
};

//
class TestClass {
    constructor() {
        this.transfer = IW.transfer(new Uint32Array([5]));
        this.copying = new Uint32Array([6]);
        this.reassign = new Uint32Array([7]);

        this.husband = IW.classed(new Husband());
        this.brother = IW.classed(new Brother());

        this.callback = ()=>{ console.error("Something wrong..."); };
    }

    //
    async recall(...args) {
        await this.callback(...args);

        // explain exactly, please...
        return "exactly";
    }

    // test an shared array buffer
    async change(shared) {
        
        new Uint32Array(shared, 0, 1)[0] = 5;
        console.log(await this.transfer);
        
    }
};

//
export const test = IW.classed(TestClass);
