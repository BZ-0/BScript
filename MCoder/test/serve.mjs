//import * as Gluon from '@gluon-framework/gluon';

// ESM
import path from 'path'
import fastifyStatic from '@fastify/static'
import cors from '@fastify/cors'
import disableCache from "fastify-disablecache";

//
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

//
const __filename = fileURLToPath(import.meta.url + "/../")
const __dirname = dirname(__filename)

//
export default async function (fastify, options) {

    //
    fastify.addHook('onSend', function (req, reply, payload, next) {
        reply.header("Cross-Origin-Embedder-Policy", "require-corp");
        reply.header("Cross-Origin-Opener-Policy", "same-origin");
        reply.header("Service-Worker-Allowed", "/test/");
        next()
    })

    //
    fastify.register(cors, {
        // put your options here
        hook: 'preHandler',
        delegator: (req, callback) => {
            const corsOptions = {
            // This is NOT recommended for production as it enables reflection exploits
            origin: true
            };
        
            // do not include CORS headers for requests from localhost
            if (/^localhost$/m.test(req.headers.origin)) {
            corsOptions.origin = false
            }
        
            // callback expects two parameters: error and options
            callback(null, corsOptions)
        },
        allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept",
        origin: "*",
        cacheControl: "no-cache"
    })

    //
    fastify.register(disableCache);

    // 
    fastify.register(fastifyStatic, {
        prefix: '/', root: path.join(__dirname, './test'),
        list: true
    });

    //
    ["jng", "test", "coder", "loader", "esm"].map(($n)=>{
        fastify.register(fastifyStatic, {
            prefix: `/${$n}/`, root: path.join(__dirname, `./${$n}`),
            decorateReply: false,
            list: true
        });
    });

    //
    ["indexeddb-fs"].map(($n)=>{
        fastify.register(fastifyStatic, {
            prefix: `/${$n}/`, root: path.join(__dirname, `./node_modules/${$n}/`),
            decorateReply: false,
            list: true
        })
    });
}

export const options = {
    ignoreTrailingSlash: true,
    port: 4000
}
