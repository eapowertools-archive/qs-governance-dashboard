const ipaddr = require("ipaddr.js");

function checkIp(entry) {
    const addr = ipaddr.parse(entry);

    if (entry == "::1") {
        return "127.0.0.1";
    }

    if (addr.kind() == "ipv6") {
        const processedIp = ipaddr.process(entry);
        return processedIp.octets.join(".");
    }

    return addr.toString();
}

module.exports = checkIp;