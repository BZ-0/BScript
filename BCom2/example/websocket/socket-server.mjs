import { serve } from "https://deno.land/std@0.150.0/http/server.ts";
import { Server } from "https://deno.land/x/socket_io@0.1.1/mod.ts";
import { WrapSocket } from "src/js/Handlers/SocketHandler.mjs";
import IW from "src/index.mjs";

//
const io = new Server({
    'timeout': 60000, 'connect timeout': 4000,
    cors: {
        origin: "http://localhost:4000",
        methods: ["GET", "POST"]
    }
});

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
        // socket unable to do that
        // (planned to fix that with BTyped integration)
        new Uint32Array(shared, 0, 1)[0] = 5;

        //
        console.log(await this.transfer);
        
    }
};

//
io.on("connection", (socket) => {
    const _export_ = WrapSocket(socket);
    _export_.test = IW.classed(TestClass);
    io.emit("ping", {});
});

//
await serve(io.handler(), {
    port: 3000
});
