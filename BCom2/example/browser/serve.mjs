//import * as Gluon from '@gluon-framework/gluon';

// ESM
import path from 'path'
//import fs from 'fs'
//import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
//import autoLoad from '@fastify/autoload'
import cors from '@fastify/cors'

//
import { fileURLToPath } from 'url'
import { dirname } from 'path'

//
const __filename = fileURLToPath(import.meta.url + "/../../")
const __dirname = dirname(__filename)

//
/*const fastify = Fastify({
    logger: true
});*/

export default function (fastify, _, done) {

    //
    fastify.addHook('onSend', function (_req, reply, _payload, next) {
        reply.header("Access-Control-Allow-Origin", "*");
        reply.header("Cross-Origin-Embedder-Policy", "require-corp");
        reply.header("Cross-Origin-Opener-Policy", "same-origin");
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
    fastify.register(fastifyStatic, {
        prefix: '/', root: path.join(__dirname, 'example/browser'),
        list: true
    });

    // 
    fastify.register(fastifyStatic, {
        prefix: '/worker/', root: path.join(__dirname, 'example/worker'),
        decorateReply: false,
        list: true
    });

    // 
    fastify.register(fastifyStatic, {
        prefix: '/browser/', root: path.join(__dirname, 'example/browser'),
        decorateReply: false,
        list: true
    });

    // 
    fastify.register(fastifyStatic, {
        prefix: '/src/', root: path.join(__dirname, 'src'),
        decorateReply: false,
        list: true
    });

    //
    ["jsox", "@petamoriken", "@msgpack", "cbor-x"].map(($n)=>{
        fastify.register(fastifyStatic, {
            prefix: `/${$n}/`, root: path.join(__dirname, `./node_modules/${$n}/`),
            decorateReply: false,
            list: true
        })
    });

    done();
}

export const options = {
    ignorePattern: /.*(DAL).js/,
    ignoreTrailingSlash: true,
    port: 4000
}
