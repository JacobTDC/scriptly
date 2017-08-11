process.title = "Requiring modules...";

const Discordie = require("discordie");
const util = require('util');
const vm = require('vm');
const fs = require('fs');

const repl = require('repl');
const r = repl.start('> ');

process.title = "Connecting...";

const Events = Discordie.Events;
const client = new Discordie({ autoReconnect: true });
client.autoReconnect.enable();
const token = require('./_private/token');

var JacobTDCavatar = "https://images-ext-1.discordapp.net/external/6OCvNEq35zuCsWDP9Qh56NX21UtFLBeR1JyKu1eQVVU/https/cdn.discordapp.com/avatars/322513390272512002/eb6287875d74bba062e57a110ef6bb9c.jpg";

client.connect({ token: token });

client.Dispatcher.on(Events.GATEWAY_READY, e => {
    client.User.setStatus("online");
    client.User.setGame("JavaScript");
    console.log("Connected as: " + client.User.username);
    process.title = "Discord Bot:  " + client.User.username;
    console.log("> Active on " + client.Guilds.length + " servers");
    console.log("> Connected Servers:");
    client.Guilds.forEach(guild => {
        console.log("  Connected to:\n    Name - " + guild.name + "\n    Owner - " + guild.owner.username + "#" + guild.owner.discriminator + "\n    Region - " + guild.region);
    });
    r.displayPrompt();
});

client.Dispatcher.on(Events.DISCONNECTED, (e) => {
    console.log("Client disconnected.");
    console.log("  " + e.error)
    if (e.autoReconnect) {
        console.log("  Will attempt to reconnect in " + e.delay + " milliseconds.");
    } else {
        console.log("  Will not attempt to reconnect.");
    }
    r.displayPrompt();
});

client.Dispatcher.on(Events.GUILD_CREATE, (e, guild, becameAvailable) => {
    console.log("  Connected to:\n    Name - " + e.guild.name + "\n    Owner - " + e.guild.owner.username + "#" + e.guild.owner.discriminator + "\n    Region - " + e.guild.region);
    r.displayPrompt();
});



//----------------------------------------------------------------------------------------------------



client.Dispatcher.on(Events.MESSAGE_CREATE, e => {
    var message = e.message;
    var content = message.content;
    if (message.author.id != client.User.id && !message.author.bot) {
        if (client.User.isMentioned(message, false)) {
            if (content == client.User.mention + " info") embed(e.message.author.mention, genInfoEmbed(), e);
            if (content == client.User.mention + " help") embed(e.message.author.mention, genHelpEmbed(), e);
            if (content == client.User.mention + " discordie info") reply("https://qeled.github.io/discordie", e);
        } else {
            if (content.indexOf("JavaScript: `") == 0 && content.indexOf("`", content.length - 1) == content.length - 1) {
                var script = content.substring(13, content.length - 1);
                var data = myEval(script, e);
                if (!data.err) {
                    message.channel.sendMessage(message.author.mention, false, genResultEmbed(util.inspect(data.data)));
                } else {
                    message.channel.sendMessage(message.author.mention, false, genErrorEmbed(data.data));
                }
            }
            if (content.indexOf("!JavaScript: `") == 0 && content.indexOf("`", content.length - 1) == content.length - 1) {
                var script = content.substring(14, content.length - 1);
                myEval(script, e);
            }
        }
    }
});

function sendMsg(msg, e) {
    e.message.channel.sendTyping()
    setTimeout(function () {
        e.message.channel.sendMessage(msg);
    }, 1000);
}

function embed(msg, embed, e) {
    e.message.channel.sendTyping()
    setTimeout(function () {
        e.message.channel.sendMessage(msg, false, embed);
    }, 1000);
}

function sendMsgTo(msg, channel) {
    channel.sendTyping()
    setTimeout(function () {
        channel.sendMessage(msg);
    }, 1000);
}

function reply(msg, e) {
    e.message.channel.sendTyping()
    setTimeout(function () {
        e.message.reply(msg);
    }, 1000);
}

function embedReply(msg, embed, e) {
    e.message.channel.sendTyping()
    setTimeout(function () {
        e.message.reply(msg, false, embed);
    }, 1000);
}

function deleteMsg(e) {
    e.message.delete();
}

function myEval(code, e) {
    let result;
    let script;
    let sandbox = {/*reply: reply, sendMsg: sendMsg, deleteMsg: deleteMsg, embed: embed, embedReply: embedReply, e: e, */util: util };
    let context = vm.createContext(sandbox);
    try {
        script = new vm.Script(code);
        result = script.runInContext(context, { timeout: 250 });
        return { data: result, err: false };
    } catch (err) {
        return { data: err, err: true };
    }
}

function genInfoEmbed() {
    var package = JSON.parse(fs.readFileSync("package.json"));
    return {
        author: {
            name: client.User.username,
            icon_url: client.User.avatarURL
        },
        title: "Scriptly Information:",
        description: `Name:  Scriptly\nDescription:  ${package.description}\nVersion:  ${package.version}\nCreator:  ${package.author}\nDedicated server:  https://discord.gg/cknBZCe\nClient ID:  [${client.User.id}](https://discordapp.com/oauth2/authorize?client_id=${client.User.id}&scope=bot)`,
        color: 0x33DBFF,
        timestamp: new Date(),
        footer: {
            icon_url: JacobTDCavatar,
            text: `Licensed by JacobTDC under ${package.license} License.`
        }
    };
}

function genHelpEmbed() {
    return {
        author: {
            name: client.User.username,
            icon_url: client.User.avatarURL
        },
        title: "Help:",
        description: "To run script, type: \"JavaScript: `code goes in code formatting`\"\nTo view an information menu, type `@Scriptly info`\nTo get a link to the discordie documentation, type `@Scriptly discordie info`",
        color: 0x33DBFF,
        timestamp: new Date(),
        footer: {
            icon_url: JacobTDCavatar,
            text: "Copyright 2017 by JacobTDC"
        }
    };
}

function genErrorEmbed(err) {
    var replErr = new repl.Recoverable(err);
    var errStr = replErr.err.stack;
    return {
        title: replErr.err.toString(),
        description: errStr.substring(0, errStr.indexOf("\n    at")),
        color: 0xFF5733,
        timestamp: new Date(),
    };
}

function genResultEmbed(data) {
    return {
        description: data,
        color: 0x33FF57,
        timestamp: new Date(),
    };
}



//----------------------------------------------------------------------------------------------------



r.defineCommand('kill', {
    help: 'Terminate the bot',
    action() {
        client.User.setStatus("invisible");
        client.disconnect();
        console.log("Bot killed.");
        r.close();
    }
});