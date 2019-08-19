var express = require('express');
var router = express.Router();
let db = require('../database/db');
let promiseForeach = require('promise-foreach');
let Discord = require('discord.js');
let bcrypt = require('bcrypt');
let moment = require('moment');
router.get('/', (req, res) => {
    if (req.session.loggedIn == true) {
        res.redirect('/dashboard');
    } else {
        res.render('guest/login');
    }
});
router.get('/hdj/reviews/create', (req, res) => {
    if (req.session.loggedIn == true) {
        let ranksArray = [];
        let count = 0;
        let menuArray = [];
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })
        let users = [];
        db.query("SELECT * FROM users", [], (err, result) => {
            if (err) {
                res.end('error');
            }
            result.rows.forEach(user => {
                if (Math.max(...user.ranks.split(',')) < req.session.highestRank) {
                    users.push(user);
                }
            })
        })
        setTimeout(() => {

            res.render('hdj/create-review', {
                user: req.session,
                ranks: mergedArray,
                menu: menuArray,
                users: users
            });
        }, 1000);
    } else {
        res.redirect('/');
    }
})
router.get('/user/dashboard', (req, res) => {
    if (req.session.username !== undefined) {
        res.redirect('/dashboard');
    }
})
router.get('/logout', (req, res) => {
    if (req.session.loggedIn == true) {
        req.session.destroy(() => {
            res.redirect('/');
        })
    } else {
        res.redirect('/');
    }
})
router.get('/hdj/warning/create', (req, res) => {
    if (req.session.loggedIn == true) {
        let ranksArray = [];
        let count = 0;
        let menuArray = [];
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })
        let users = [];
        db.query("SELECT * FROM users", [], (err, result) => {
            if (err) {
                res.end('error');
            }
            result.rows.forEach(user => {
                if (Math.max(...user.ranks.split(',')) < req.session.highestRank) {
                    users.push(user);
                }
            })
        })
        setTimeout(() => {

            res.render('hdj/create-warning', {
                user: req.session,
                ranks: mergedArray,
                menu: menuArray,
                users: users
            });
        }, 1000);
    } else {
        res.redirect('/');
    }
});
router.get('/dashboard', (req, res) => {
    if (req.session.loggedIn == true) {
        let ranksArray = [];
        let count = 0;
        let menuArray = [];
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1 ORDER BY rank_order", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })
        setTimeout(() => {

            res.render('main/index', {
                user: req.session,
                ranks: mergedArray,
                menu: menuArray
            });
        }, 1000);
    } else {
        res.redirect('/');
    }
})
router.get('/user/staff-list', (req, res) => {
    if (req.session.loggedIn == true) {
        let userArray = [];
        let ranksArray = [];
        let count = 0;
        let menuArray = [];
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1 ORDER BY id DESC", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })
        db.query("SELECT * FROM users ORDER BY id ASC ", [], (err, result) => {
            userArray.push(...result.rows);
        });
        setTimeout(() => {
            res.render('main/staff-list', {
                ranks: mergedArray,
                user: req.session,
                users: userArray,
                math: Math
            });
        }, 1000);
    } else {
        res.redirect('/');
    }
})
router.get('/leader/staff/list', (req, res) => {
    if (req.session.loggedIn == true) {
        let userArray = [];
        let ranksArray = [];
        let count = 0;
        let menuArray = [];
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1 ORDER BY id DESC", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })
        db.query("SELECT ( string_to_array( ranks, ',' ) ) [ array_length(string_to_array( ranks, ',' ), 1 ) ] as highestRank, * FROM users WHERE ( SELECT ( string_to_array( ranks, ',' ) ) [ array_length(string_to_array( ranks, ',' ), 1 ) ] ) <= $1", [req.session.highestRank], (err, result) => {
            userArray.push(...result.rows);
        });
        setTimeout(() => {
            res.render('leader/staff-list', {
                ranks: mergedArray,
                user: req.session,
                users: userArray,
                math: Math
            });
        }, 1000);
    } else {
        res.redirect('/');
    }
})
router.get('/radio/imaging', (req, res) => {
    if (req.session.loggedIn == true) {
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1 ORDER BY id DESC", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })
        let radioImaging = [];
        db.query("SELECT * FROM resources WHERE rank = '2' ORDER BY id DESC", [], (err, result) => {
            radioImaging.push(...result.rows);
        })
        setTimeout(() => {
            res.render('radio/imaging', {
                user: req.session,
                ranks: mergedArray,
                imagings: radioImaging
            });
        }, 1000);
    } else {
        res.redirect('/');
    }
})
router.get('/radio/banned-songs', (req, res) => {
    if (req.session.loggedIn == true) {
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1 ORDER BY id DESC", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })
        let bannedSongs = [];
        db.query("SELECT * FROM banned_songs ORDER BY id DESC", [], (err, result) => {
            if (err) {
                res.end('err');
            } else {
                bannedSongs.push(...result.rows);
            }
        })
        setTimeout(() => {
            res.render('radio/banned-songs', {
                user: req.session,
                ranks: mergedArray,
                songs: bannedSongs
            });
        }, 1000);
    } else {
        res.redirect('/');
    }

})
router.get('/radio/connection-information', (req, res) => {
    if (req.session.loggedIn == true) {
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1 ORDER BY id DESC", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })
        let connection = [];
        db.query("SELECT * FROM connection_information WHERE username = $1 ORDER BY id DESC", [req.session.username], (err, result) => {
            if (err) {
                res.end('err');
            } else {
                connection.push(...result.rows);
            }
        })
        setTimeout(() => {
            console.log(connection);
            res.render('radio/connection-information', {
                user: req.session,
                ranks: mergedArray,
                connection: connection
            });
        }, 1000);
    } else {
        res.redirect('/');
    }

})
router.get('/admin/kick-dj', (req, res) => {
    if (req.session.loggedIn == true) {
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1 ORDER BY id DESC", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })

        setTimeout(() => {
            res.render('admin/kick-dj', {
                user: req.session,
                ranks: mergedArray,
            });
        }, 1000);
    } else {
        res.redirect('/');
    }
})
router.get('/radio/timetable', (req, res) => {
    if (req.session.loggedIn == true) {
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1 ORDER BY id DESC", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })
        let bookedSlots = [];
        db.query("SELECT * FROM timetable", [], (err, result) => {
            if (err) {
                res.render('error');
            } else {
                for (let index = 0; index < 8; index++) {
                    bookedSlots[index] = [];
                    for (let j = 0; j <= 23; j++) {
                        bookedSlots[index][j] = [];
                        result.rows.forEach(row => {
                            if (row.day == index && row.hour == j) {
                                bookedSlots[index][j].push(row);
                            }
                        })
                    }
                }
            }
        })
        setTimeout(() => {
            res.render('radio/timetable', {
                user: req.session,
                ranks: mergedArray,
                bookedSlots: bookedSlots,
                moment: moment
            });
        }, 1000);
    } else {
        res.redirect('/');
    }
})
router.get('/radio/requests', (req, res) => {


    if (req.session.loggedIn == true) {
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1 ORDER BY id DESC", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })
        setTimeout(() => {
            res.render('radio/requests', {
                user: req.session,
                ranks: mergedArray,
                moment: moment
            });
        }, 1000);
    } else {
        res.redirect('/');
    }
})
router.get('/leader/job-applications', (req, res) => {
    if (req.session.loggedIn == true) {
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1 ORDER BY id DESC", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })
        setTimeout(() => {
            res.render('leader/applications', {
                user: req.session,
                ranks: mergedArray
            });
        }, 1000);
    } else {
        res.redirect('/');
    }
})
router.get('/user/edit-details', (req, res) => {
    if (req.session.loggedIn == true) {
        let mergedArray = {};
        mergedArray.ranks = [];
        req.session.ranks.split(',').forEach(rank => {
            db.query("SELECT * FROM ranks WHERE ranks.id = $1 ORDER BY id DESC", [rank], (err, response) => {

                mergedArray.ranks.push(...response.rows);
                mergedArray.ranks.forEach(rank1 => {
                    db.query("SELECT * FROM menus WHERE menus.rank_id = $1", [rank1.id], (err, resp) => {
                        let thing = mergedArray.ranks.map(r => {
                            return r.id
                        }).indexOf(rank1.id);
                        mergedArray.ranks[thing]['menus'] = [];
                        mergedArray.ranks[thing]['menus'].push(...resp.rows)
                    })
                })

            })
        })
        setTimeout(() => {
            res.render('main/edit-details', {
                user: req.session,
                ranks: mergedArray
            });
        }, 1000);
    } else {
        res.redirect('/');
    }
})
module.exports = router;