var express = require('express');
var router = express.Router();
var db = require('../database/db');
var bcrypt = require('bcrypt');
const config = require('../config.json');
let discordServer = require('../utils/discord');
let request = require('request');
let fs = require('fs');
let multer = require('multer');

function generatePassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}
router.post('/discord/send', (req, res) => {
    if (req.body.msg_type == 'apply') {
        let output = [];
        console.log(req.body.discord);
        discordServer.bot.guilds.get(config.serverID).members.find(m => m.user.tag == req.body.discord).createDM().then(channel => {
                    channel.send(':tada: Application Successful!');
                    channel.typing = true;
                    setTimeout(() => {
                        channel.send('Thanks for your application, we cannot wait to start working with you!');
                        channel.typing = true;
                    }, 1000);
                    setTimeout(() => {
                        channel.send('One of our Leaders will be in contact within 24 hours! ');
                    }, 2000);
                    setTimeout(() => {
                        channel.send('Good luck!');
                    }, 3000);
        }).catch(error => {
            if(error)
            {
                res.send(error);
            }
        })
        res.end('ok');
    } else {
        res.end('not apply? Wtf.');
    }
})

function getPercentageChange(oldNumber, newNumber) {
    var decreaseValue = oldNumber - newNumber;

    return Math.floor((decreaseValue / oldNumber) * 100);
}
router.get('/dash-stats', (req, res) => {
    let resultArr = {};
    resultArr.dj = [];
    resultArr.listeners = [];
    resultArr.rps = [];
    resultArr.likes = [];
    db.query("SELECT * from listener_count WHERE time >= (NOW() - INTERVAL '1 hour') ORDER BY id LIMIT 1", [], (err, result) => {
        let thing;
        if (result.rowCount == 0) {
            thing = 0;
        } else {
            thing = result.rows[0].count

        }
        resultArr.listeners.push({
            lasthour: thing
        });
        db.query("SELECT * FROM listener_count ORDER BY id DESC LIMIT 1", [], (err, result) => {
            let second = {
                'now': result.rows[0].count,
                'percent': thing == 0 ? 100 : getPercentageChange(resultArr.listeners[0].lasthour, result.rows[0].count)
            };

            resultArr.listeners.push(second);
        });
    });

    request("https://radio.itspulse.net/api/nowplaying", {}, (err, resp, body) => {
        if (!err) {
            body = JSON.parse(body);
            resultArr.dj.push({
                currentDJ: body[0].live.is_live == true ? body[0].live.streamer_name : 'Auto DJ'
            });
            db.query("SELECT COUNT(id) FROM likes WHERE dj = $1 AND is_hidden != '1'", [req.session.username], (err, result) => {
                if (!err) {
                    let likes = result.rows[0].count;
                    db.query("SELECT COUNT(id) FROM likes WHERE time >= date_trunc('month', current_date - interval '1' month) and time < date_trunc('month', current_date) AND dj = $1", [req.session.username], (err, result) => {
                        if (!err) {
                            resultArr.likes.push({
                                likesLM: result.rows[0].count,
                                difference: getPercentageChange(likes, result.rows[0].count),
                                likes: likes
                            })
                        }
                    })
                }
            })
            db.query("SELECT COUNT(id) FROM reward_points WHERE dj = $1 AND is_hidden != '1'", [req.session.username], (err, result) => {
                if (!err) {
                    let rps = result.rows[0].count;
                    db.query("SELECT COUNT(id) FROM reward_points WHERE time >= date_trunc('month', current_date - interval '1' month) and time < date_trunc('month', current_date) AND dj = $1", [req.session.username], (err, result) => {
                        if (!err) {
                            resultArr.rps.push({
                                rewardsLM: result.rows[0].count,
                                difference: getPercentageChange(rps, result.rows[0].count),
                                rewards: rps
                            })


                            res.status(200).json(resultArr);
                        }
                    })
                }
            })
        }
    })

})
router.post('/leader/reset-avatar/:id', (req, res) => {
    if (req.session.loggedIn == true && req.params.id) {
        let id = req.params.id;
        db.query("UPDATE users SET avatar = $1 WHERE id = $2", ['/assets/avatars/default.png', id], (err, result) => {
            if (err) {
                console.log(err);
                res.end('err');
            } else {
                res.end('ok');
            }
        })
    }
})
router.post('/leader/delete/:id', (req, res) => {
    if (req.session.loggedIn == true) {
        let id = req.params.id;
        db.query("UPDATE users SET is_deleted = '1' WHERE id = $1", [id], (err, result) => {
            if (err) {
                console.log(err);
                res.end('err');
            } else {
                res.end('ok');
            }
        })
    }
})
router.post('/leader/suspend/:id', (req, res) => {
    if (req.session.loggedIn == true) {
        let id = req.params.id;
        db.query("UPDATE users SET is_suspended = '1' WHERE id = $1", [id], (err, result) => {
            if (err) {
                console.log(err);
                res.end('err');
            } else {
                db.query("INSERT INTO suspensions(user_id, start, \"end\", \"by\", is_over) VALUES($1, $2, $3, $4, '0')", [id, new Date(), new Date().setDate(new Date().getDate() + 7).toLocaleString('en-UK'), req.session.username], (err, result) => {
                    if (err) {
                        console.log(err);
                        res.end('err');
                        return;
                    }
                })
                res.end('ok');
            }
        })
    }
})
router.post('/leader/edit/:id', (req, res) => {
    if (req.session.loggedIn == true && req.params.id !== undefined) {
        let username = req.body.username;
        let discord = req.body.discord;
        let ranks = req.body.ranks;
        db.query("UPDATE users SET username = $1, discord = $2, ranks = $3 WHERE id = $4", [username, discord, ranks, req.params.id], (err, result) => {
            if (err) {
                res.end('error')
            } else {
                discordServer.bot.guilds.get(config.serverID).members.find(m => m.user.tag == discord).createDM().then(channel => {
                    channel.send(':warning: Hey! Your Discord was changed by your leader. :warning:');
                }).catch(error => {
                    if(error)
                    {
                        res.send(error); res.end('user_not_found');
                    }
                })
                res.end('ok');
            }
        })
    }
})
router.post('/listener-count', (req, res) => {
    db.query('INSERT INTO "public"."listener_count"("count", "time") VALUES ($1, $2) RETURNING *', [req.body.listeners.current, new Date()], (err, result) => {
        if (err) {
            console.log(err)
            return;
        }
        res.json({
            message: 'ok'
        })
    })

})
router.post('/dj', (req, res) => {
    db.query('INSERT INTO "public"."dj_logs"("dj_name", "time") VALUES ($1, $2) RETURNING *', [req.body.live.streamer_name, new Date()], (err, result) => {
        if (err) {
            console.log(err)
            return;
        }
    })
    res.json({
        message: 'ok'
    })
})
router.post('/song-change', (req, res) => {
    db.query("INSERT INTO song_logs(song,artist,time,dj) VALUES($1, $2, $3, $4) RETURNING id", [req.body.now_playing.song.title, req.body.now_playing.song.artist, new Date(), req.body.live.streamer_name], (err, result) => {
        if (err) {
            console.log(err);
            return;
        }
        request.get('https://radio.itspulse.net/api/station/1/history', {
            headers: {
                Authorization: 'Bearer ' + Buffer.from('85feee504cbc2f01:03633040c7124986f90406f8cd48ea17')
            },
            json: {
                // start: `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDay()}`,
                //end: `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDay()}`
            }
        }, (err, response, body) => {
            db.query("UPDATE song_logs SET listener_start = $1, listener_end = $2, delta_total = $3 WHERE id = $4", [body[0].listeners_start, body[0].listeners_end, body[0].delta_total, result.rows[0].id])
        });
        res.json({
            message: 'ok'
        });
    })
})

router.post('/leader/reset-pass/:id', (req, res) => {
    if (req.session.loggedIn == true && req.session.highestRank >= 6 && typeof req.params.id !== undefined) {
        let pass = generatePassword();
        db.query("UPDATE users SET password = $1 WHERE id = $2 RETURNING * ", [bcrypt.hashSync(pass, 12), req.params.id], (err, result) => {
            if (!err) {
                discordServer.bot.guilds.get(config.serverID).members.find(m => m.user.tag == result.rows[0].discord).createDM().then(channel => {
                    channel.send(`:closed_lock_with_key: Your new password for **Pulse Hub**\n\nYour leader has reset your password for **Pulse Hub**! Here are your new login details:\n\n**Username:** ${result.rows[0].username}\n**Pasword**:${pass}\n\n\n*If you think this was a mistake, please let your leader know.*`)
                    res.end('ok');
                })
            }
        }).catch(error => {
            if(error)
            {
                res.send(error); res.end('user_not_found');
            }
        })
    } else {
        res.end('ok');
    }
})
router.post('/leader/fire/:id', (req, res) => {
    if (req.session.loggedIn == true) {
        if (req.session.highestRank >= 6) {
            let id = req.params.id;

            db.query("UPDATE users SET ranks = $1 WHERE id = $2", ['1', id], (err, result) => {
                if (!err) {
                    let user = db.query("SELECT * FROM users WHERE id = $1", [id], (err, result) => {
                        discordServer.bot.guilds.get(config.serverID).members.map(m => {
                            if (m.user.tag == result.rows[0].discord) {
                                let rolesObject = discordServer.bot.guilds.get(config.serverID).roles;
                                let botRole = rolesObject.get('599173010435604481');
                                let roles = m.roles.filter(role => role.calculatedPosition < botRole.calculatedPosition && role.id !== '598614143758499840');
                                m.removeRoles(roles);
                                m.send("Hey! I have some bad news for you...");
                                setTimeout(() => {
                                    m.send("You were fired from Pulse :sob:");
                                }, 1000);
                                setTimeout(() => {
                                    m.send("Please contact your (ex-)department leader if you think this was a mistake.");
                                }, 2000);
                                res.end('ok');
                            }
                        })
                    })

                }
            })
        }
    }
})
router.post('/applications', (req, res) => {
    if (req.session.loggedIn == true) {
        if (req.session.highestRank >= 6) {
            let staffDept;
            staffDept = req.session.ranks.split(',').includes("2") ? '1' : '2';
            db.query("SELECT * FROM applications WHERE is_handled != '1' AND job_id = $1", [staffDept], (err, result) => {
                if (!err) {
                    res.json(result.rows);
                }
            })
        }
    }
})
router.post('/applications/delete/:id', (req, res) => {
    if (req.session.loggedIn == true) {
        if (req.session.highestRank >= 6) {
            var id = req.params.id;
            if (typeof id !== undefined) {
                db.query("DELETE FROM applications wHERE id = $1", [id], (err, result) => {
                    if (!err) {
                        res.json({
                            message: 'ok'
                        })
                    } else {
                        res.json({
                            message: false
                        })
                    }
                })
            } else {
                res.json({
                    message: false
                })
            }
        } else {
            res.json({
                message: false
            })
        }
    } else {
        res.json({
            message: false
        })
    }
})
router.post('/applications/handle/:id', (req, res) => {
    if (req.session.loggedIn == true) {
        if (req.session.highestRank >= 6) {
            var id = req.params.id;
            if (typeof id !== undefined) {
                db.query("UPDATE applications SET is_handled = 1, handled_by = $1 WHERE id = $2", [req.session.username, id], (err, result) => {
                    if (!err) {
                        let staffDept;
                        staffDept = req.session.ranks.split(',').includes("2") ? '2' : '3';
                        let password = generatePassword();
                        db.query("SELECT * FROM applications WHERE id = $1", [id], (error, response) => {
                            db.query('INSERT INTO "public"."users"("username", "password", "avatar", "discord", "likes", "is_suspended", "is_deleted", "hired_at", "hired_by", "ip", "ranks") VALUES ($1, $2, $3, $4, 0, 0, 0, $5, $6, null, $7) RETURNING *', [
                                response.rows[0].name, bcrypt.hashSync(password, 12), '/assets/avatars/default.png', response.rows[0].discord, new Date(), req.session.username, '1,' + staffDept
                            ], (err, insert) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    discordServer.bot.users
                                        .find('tag', response.rows[0].discord).createDM().then(channel => {
                                            discordServer.bot.guilds.get('598614143758499840').members.map(m => {
                                                if (m.user.tag == response.rows[0].discord) {
                                                    //m.addRole(discordServer.bot.guilds.get('598614143758499840').roles.get('598615987511885836'));
                                                    if (staffDept == '2') {

                                                        // radio 
                                                        // m.addRole(discordServer.bot.guilds.get('598614143758499840').roles.get('598616037683888172'))

                                                    } else {
                                                        // media
                                                        m.addRole(discordServer.bot.guilds.get('598614143758499840').roles.get('598616056637947935'));
                                                    }
                                                    request.post('https://radio.itspulse.net/api/station/1/streamers', {
                                                        headers: {
                                                            Authorization: 'Bearer ' + Buffer.from('85feee504cbc2f01:03633040c7124986f90406f8cd48ea17')
                                                        },
                                                        json: {
                                                            "streamer_username": response.rows[0].name,
                                                            "streamer_password": password,
                                                            "display_name": response.rows[0].name,
                                                            "comments": staffDept == '2' ? 'Radio DJ' : 'Media Reporter',
                                                            "is_active": true
                                                        }
                                                    }, (err, response1, body) => {
                                                        if (err) {
                                                            console.log(err);
                                                            res.end('error');
                                                        } else {
                                                            db.query("INSERT INTO connection_information(username, ip, port, password, dj_name) VALUES($1, DEFAULT, DEFAULT, $2,$3)", [response.rows[0].name, response.rows[0].name + ":" + password, response.rows[0].name], (err, result) => {
                                                                if (err) {
                                                                    console.log(error);
                                                                    res.end('err');
                                                                } else {
                                                                    let chnl = discordServer.bot.channels.get('598620130896904193');
                                                                    //chnl.send(`Please welcome ${m.user} to ${staffDept == 2 ? 'Radio Department!' : 'News Department!'}`)
                                                                    // m.addRole(discordServer.bot.guilds.get('598614143758499840').roles.get('601509607457816619'));        

                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                            channel.send(":tada: Welcome to **Pulse**!\n\nWhat a great choice you have just made :astonished:  Your manager has just made you a PulseHub account, here are the login details..\n\nUsername: " + response.rows[0].name + "\n Password: " + password + "\n URL - http://hub.itspulse.net:8080");
                                        }).catch(error => {
                                            if(error)
                                            {
                                                res.send(error); res.end('user_not_found');
                                            }
                                        })
                                }
                            })
                            res.json({
                                'message': 'ok'
                            })
                        })
                    } else {
                        res.json({
                            message: false,
                            error: err
                        })
                    }
                })
            } else {
                res.json({
                    message: false,
                    error: 'ID is undefined.'
                })
            }
        }
    } else {
        res.json({
            message: false,
            error: 'Login needed'
        })
    }
})
router.post('/requests/delete/:id', (req, res) => {
    if (req.session.loggedIn == true) {
        var id = req.params.id;
        if (typeof id !== undefined) {
            db.query("UPDATE requests SET is_deleted = '1' WHERE id = $1", [id], (err, result) => {
                if (!err) {
                    res.json({
                        'message': 'ok'
                    })
                } else {
                    res.json({
                        message: false
                    })
                }
            })
        } else {
            res.json({
                message: false
            })
        }
    } else {
        res.json({
            message: false
        })
    }
})
router.post('/requests', (req, res) => {
    if (req.session.loggedIn == true) {
        let arr = [];
        db.query("SELECT * FROM requests WHERE is_deleted != '1' ORDER BY timestamp DESC", [], (err, result) => {
            if (!err) {
                arr.push(...result.rows);
                arr['message'] = 'ok'
            } else {
                console.log(err);
                res.json({
                    message: false
                });
                return;
            }
        });
        setTimeout(() => {
            res.json(arr);
        }, 1000);
    } else {
        res.json({
            message: false
        });
    }
})
router.post('/discord', (req, res) => {
    var username = req.body.username;
    const query = {
        text: 'SELECT * FROM users WHERE username = $1',
        values: [username]
    };
    let userDiscord = null;
    db.query(query, (err, response) => {
        let json = {};
        if (response.rowCount > 0) {
            userDiscord = response.rows[0].discord;
            let m = discordServer.bot.users.find('tag', userDiscord);
            m.createDM().then(channel => {
                let msg = channel.send('Did you try to login to Pulse Hub? React to this message.');
                msg.then(m => {
                    m.react('✅');
                    m.react('❎');
                    m.awaitReactions(filter, {
                        max: 1,
                        time: 60000,
                        errors: ['time']
                    }).then(collected => {
                        const reaction = collected.first();
                        if (reaction.emoji.name == '✅') {
                            Object.keys(response.rows[0]).forEach(key => {
                                req.session[key] = response.rows[0][key];
                            })
                            let ranks = response.rows[0].ranks.split(',');
                            Object.keys(ranks).forEach(key => {
                                req.session.ranks[key] = ranks[key];
                            })
                            req.session.highestRank = Math.max.apply(null, ranks);
                            req.session.loggedIn = true;
                            db.query({
                                text: 'UPDATE users SET ip = $1 WHERE id = $2',
                                values: [new Buffer(req.ip).toString('base64'), response.rows[0].id]
                            })
                            res.json({
                                verified: true
                            });
                        } else {
                            res.json({
                                verified: false
                            });
                        }
                    });
                })
                const filter = (reaction, user) => {
                    return ['✅', '❎'].includes(reaction.emoji.name) && user.id === m.id;
                }
            }).catch(error => {
                if(error)
                {
                    res.send(error); res.end('user_not_found');
                }
            })
        } else {
            json.message = 'userNotFound';
        }
    })

})
router.post('/login', (req, res) => {
    var username = req.body.username,
        password = req.body.password;
    const query = {
        text: 'SELECT * FROM users WHERE username = $1',
        values: [username]
    }
    db.query(query, (err, response) => {
        var json = {};
        if (response.rowCount > 0) {
            if (typeof response.rows[0].username !== null) {
                var compare = bcrypt.compareSync(password, response.rows[0].password);
                if (compare == true) {
                    let currentIp = new Buffer(req.ip).toString('base64');
                    if (currentIp == response.rows[0].ip) {
                        json.message = 'ok';
                        Object.keys(response.rows[0]).forEach(key => {
                            req.session[key] = response.rows[0][key];
                        })
                        let ranks = response.rows[0].ranks.split(',');
                        Object.keys(ranks).forEach(key => {
                            req.session.ranks[key] = ranks[key];
                        })
                        req.session.highestRank = Math.max.apply(null, ranks);
                        if (req.session.highestRank > 1) {
                            req.session.loggedIn = true;
                            res.json(json);
                        } else {
                            res.json({
                                'message': 'unauthorized_login'
                            })
                        }
                    } else {
                        json.message = 'discordVerification';
                        res.json(json);
                    }
                } else {
                    json.message = 'invalidPassword';
                    res.json(json);
                }
            } else {
                json.message = 'userNotFound';
                res.json(json);
            }
        }
    });
})
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, '../public/assets/avatars/');
    },
    filename: function (req, file, callback) {
        callback(null, req.session.username + ".jpg");
    }
});
var upload = multer({
    storage: storage
});
router.post('/hdj/create-warning', (req, res) => {
    if (req.session.loggedIn == true) {
        let user = req.body.user;
        let points = req.body.points;
        let reason = req.body.reason;

        db.query("INSERT INTO warnings(user_id, points, reason, added_by, added_date, deleted) VALUES($1, $2, $3, $4, $5, '0')", [user, points, reason, req.session.username, new Date()], (err, result) => {
            if (err) {
                console.log(err);
                res.end('error');
            } else {
                res.end('ok');
            }
        })
    }
})
router.post('/hdj/create-review', (req, res) => {
    if (req.session.loggedIn == true) {
        let user = req.body.user;
        let review = req.body.review;
        let type = req.body.type;
        let staffDept;
        staffDept = req.session.ranks.split(',').includes("2") ? '1' : '2';
        db.query("INSERT INTO reviews(user_id, review, added_by,added_date, accepted, type, dept) VALUES($1, $2, $3,$4,'0', $5, $6) RETURNING *", [user, review, req.session.username, new Date().toLocaleDateString('en-UK'), type, staffDept], (err, result) => {
            if (err) {
                console.log(err);
                res.end('error');
            } else {
                res.end('ok');
            }
        })
    }
})
router.post('/radio/book/:day/:hour', (req, res) => {
    if (req.session.loggedIn == true) {
        let day = req.params.day
        let hour = req.params.hour

        db.query("SELECT * FROM timetable WHERE day = $1 AND hour = $2", [day, hour], (err, result) => {
            if (err) {
                console.log(err);
            }
            if (result.rowCount == 0) {
                db.query('INSERT INTO "public"."timetable"("username", "day", "hour", "is_covering") VALUES ($1, $2, $3,  \'false\') RETURNING *', [req.session.username, day, hour], (err, result) => {
                    if (err) {
                        console.log(err);
                        res.end('err');
                    } else {
                        res.end('ok');
                    }
                })
            } else {
                if (req.session.username == result.rows[0].username || req.session.highestRank >= 6) {
                    db.query('DELETE FROM timetable WHERE day = $1 AND hour = $2', [day, hour], (err, result) => {
                        if (err) {
                            console.log(err);
                            res.end('error');
                        } else {
                            res.end('unbooked');
                        }
                    })
                } else {
                    res.end('false');
                }
            }
        })
    }
})
router.post('/user/edit-details', upload.any(), (req, res) => {
    if (req.session.loggedIn == true) {
        if (req.body.password == req.body.passag) {
            let hashed = bcrypt.hashSync(req.body.password, 12);
            db.query("UPDATE users SET password = $1, avatar = $3 WHERE username = $2", [hashed, req.session.username, '/assets/avatars/' + req.session.username + '.jpg'], (err, result) => {
                if (err) {
                    res.end(err);
                } else {
                    console.log(req.files)
                    var img = fs.readFileSync(req.files[0].path);
                    var encode_image = img.toString('base64');

                    var finalImg = {
                        contentType: req.files[0].mimetype,
                        image: new Buffer(encode_image, 'base64')
                    };
                    req.session.avatar = 'https://hub.itspulse.net:8080/assets/avatars/' + req.session.username + ".jpg";
                    fs.writeFileSync('C:\\users\\berkishot\\Desktop\\hub\\public\\assets\\avatars\\' + req.session.username + ".jpg", finalImg.image);
                    res.end('ok');
                }
            })
        } else {
            res.end('password_mismatch');
        }
    } else {
        res.end('reload');
    }
})
module.exports = router;