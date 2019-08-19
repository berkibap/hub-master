var Discord = require('discord.js');
const bot = new Discord.Client();
let debug = require('debug')('pulse-hub:bot');
let request = require('request');
// Pulse server id: 598614143758499840
bot.on('ready', () => {
  debug(bot.user.tag + ' is ready in ' + bot.guilds.size + ' servers');
 /* setInterval(() => {
    request.get('https://radio.itspulse.net/api/nowplaying', {}, (err, result, body) => {
      body = JSON.parse(body)

      bot.user.setActivity(body[0].live.is_live == true ? body[0].live.streamer_name + ' on Pulse Radio' : body[0].now_playing.song.text + ' on Pulse Radio', {
        type: body[0].live.is_live == true ? 'LISTENING' : 'PLAYING'
      })
    })
  }, 40 * 1000);
  request.get('https://radio.itspulse.net/api/nowplaying', {}, (err, result, body) => {
    console.log(body);  
  body = JSON.parse(body);
    
    bot.user.setActivity(body[0].live.is_live == true ? body[0].live.streamer_name + ' on Pulse Radio' : body[0].now_playing.song.text + ' on Pulse Radio', {
      type: body[0].live.is_live == true ? 'LISTENING' : 'PLAYING'
    })
  }) */
})
bot.login('NTk5MTcxMjQ5NzYzMjU0Mjgz.XShTwA.h-Lbtse-WyaZT6en_Atl-RE5z-Y');

// Guild Object

let pulseGuild = bot.guilds.get('598614143758499840');
exports.server = pulseGuild
exports.bot = bot;