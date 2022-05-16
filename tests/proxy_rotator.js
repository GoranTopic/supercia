import { ProxyRotator } from '../src/proxies.js'

const r = new ProxyRotator();

let proxy = r.next()
console.log(proxy)

r.setAlive(proxy)
proxy = r.next()
console.log(proxy)

proxy = r.getAlive()
console.log(proxy)

r.setDead(proxy)
console.log(proxy)

r.setAlive(proxy)
console.log(proxy)

console.log("all proxies:" +r.getAliveList().length )
console.log("proxies left alive:" +r.getAliveList().length )
