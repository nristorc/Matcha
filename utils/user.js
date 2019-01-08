const express	= require('express');
const router 	= express.Router();
const databaseRequest = require("../models/databaseRequest");
const checkDb = new databaseRequest();
const registerValidation = require('../models/registerValidation');
let validation = new registerValidation();
const userDatabase =require('../models/userData');
const userData = new userDatabase();
const resultSort =require('../models/resultSort');
const resSort = new resultSort();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (request, file, callback) {
        const token = request.cookies.token;
        try {
            const decoded = jwt.verify(token, 'ratonlaveur', {
                algorithms: ['HS256']
            });
            callback(null, decoded.id + '-' + Date.now() + path.extname(file.originalname));
        } catch (e) {
            request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
            return response.render('index');
        }
    }
});
const upload = multer({
    storage: storage,
    limits: {fileSize: 1000000},
    fileFilter: function(request, file, callback) {
        checkFileType(file, callback);
    }
}).single('inputFile');
function checkFileType(file, callback) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return callback(null, true);
    } else {
        callback({message: "Image corrompue !"});
    }
}

filterInt = function (value) {
    if (/^(-|\+)?(\d+)$/.test(value))
        return Number(value);
    return NaN;
};

router.route('/:id').get(async (request, response) => {

        const token = request.cookies.token;
        try {
            const decoded = jwt.verify(token, 'ratonlaveur', {
                algorithms: ['HS256']
            });

            checkDb.profilCompleted(decoded.id).then((result) => {
                const number = filterInt(request.params.id);
                if (request.params.id == decoded.id) {
                    response.redirect('/profil');
                } else if(!number) {
                    request.flash('warning', 'Aucun utilisateur ne correspond à votre demande');
                    response.redirect('/profil');
                } else {
                                const sql = 'SELECT * FROM matcha.users WHERE id = ?';
                                checkDb.query(sql, [request.params.id]).then((result) => {
                                    if (result == "") {
                                        request.flash('warning', 'Aucun utilisateur ne correspond à votre demande');
                                        response.redirect('/');
                                    } else {
                                        var u = usersSocket.reduce((acc, elem) => {
                                            if (elem.id == request.params.id) {
                                                acc.push(elem);
                                            }
                                            return acc;
                                        }, []);
                                        checkDb.updateNotifications(decoded.id, request.params.id, 5).then(() => {
                                            const visits = 'INSERT INTO matcha.visits SET visitor_id = ?, visited_id = ?, visited_at = NOW()';
                                            checkDb.query(visits, [decoded.id, parseInt(request.params.id, 10)]).then((visit) => {
                                                if (visit) {
                                                    checkDb.getTags(request.params.id).then((tags) => {
                                                        checkDb.getPhotos(request.params.id).then((photos) => {
                                                            userData.userAge(result[0].birth).then((age) => {
                                                                checkDb.getLikes(decoded.id).then((liked) => {
                                                                    checkDb.getMatches(decoded.id).then((matches) => {
                                                                        checkDb.getMyReports(decoded.id).then((reports) => {
                                                                            checkDb.igotBlockedBy(decoded.id, request.params.id).then((reported) => {
                                                                                checkDb.getUserPic(request.params.id).then(() => {
                                                                                    checkDb.getUserPic(decoded.id).then(() => {
                                                                                        if (matches == ''){
                                                                                            if (reported.length === 0) {
                                                                                                u.forEach(user => {
                                                                                                    io.sockets.connected[user.socket].emit('visit', {users: usersSocket, notif: result});
                                                                                                });
                                                                                            }
                                                                                            response.render('pages/user', {
                                                                                                user: result,
                                                                                                userage: age,
                                                                                                usertags: tags,
                                                                                                userphotos: photos,
                                                                                                likes: liked,
                                                                                                matches: null,
                                                                                                reports: reports,
                                                                                                token
                                                                                            });
                                                                                        } else {
                                                                                            if (reported.length === 0) {
                                                                                                u.forEach(user => {
                                                                                                    io.sockets.connected[user.socket].emit('visit', {users: usersSocket, notif: result});
                                                                                                });
                                                                                            }
                                                                                            response.render('pages/user', {
                                                                                                user: result,
                                                                                                userage: age,
                                                                                                usertags: tags,
                                                                                                userphotos: photos,
                                                                                                likes: liked,
                                                                                                matches: matches,
                                                                                                reports: reports,
                                                                                                token
                                                                                            });
                                                                                        }
                                                                                    }).catch(() => {
                                                                                        if (matches == ''){
                                                                                            if (reported.length === 0) {
                                                                                                u.forEach(user => {
                                                                                                    io.sockets.connected[user.socket].emit('visit', {users: usersSocket, notif: result});
                                                                                                });
                                                                                            }
                                                                                            response.render('pages/user', {
                                                                                                user: result,
                                                                                                userage: age,
                                                                                                usertags: tags,
                                                                                                userphotos: photos,
                                                                                                likes: null,
                                                                                                matches: null,
                                                                                                reports: reports,
                                                                                                token
                                                                                            });
                                                                                        } else {
                                                                                            if (reported.length === 0) {
                                                                                                u.forEach(user => {
                                                                                                    io.sockets.connected[user.socket].emit('visit', {users: usersSocket, notif: result});
                                                                                                });
                                                                                            }
                                                                                            response.render('pages/user', {
                                                                                                user: result,
                                                                                                userage: age,
                                                                                                usertags: tags,
                                                                                                userphotos: photos,
                                                                                                likes: null,
                                                                                                matches: matches,
                                                                                                reports: reports,
                                                                                                token
                                                                                            });
                                                                                        }
                                                                                    })
                                                                                }).catch(() => {
                                                                                    if (matches == ''){
                                                                                        if (reported.length === 0) {
                                                                                            u.forEach(user => {
                                                                                                io.sockets.connected[user.socket].emit('visit', {users: usersSocket, notif: result});
                                                                                            });
                                                                                        }
                                                                                        response.render('pages/user', {
                                                                                            user: result,
                                                                                            userage: age,
                                                                                            usertags: tags,
                                                                                            userphotos: photos,
                                                                                            likes: null,
                                                                                            matches: null,
                                                                                            reports: reports,
                                                                                            token
                                                                                        });
                                                                                    } else {
                                                                                        if (reported.length === 0) {
                                                                                            u.forEach(user => {
                                                                                                io.sockets.connected[user.socket].emit('visit', {users: usersSocket, notif: result});
                                                                                            });
                                                                                        }
                                                                                        response.render('pages/user', {
                                                                                            user: result,
                                                                                            userage: age,
                                                                                            usertags: tags,
                                                                                            userphotos: photos,
                                                                                            likes: null,
                                                                                            matches: matches,
                                                                                            reports: reports,
                                                                                            token
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }).catch((reported) => {
                                                                                console.log('reports catch', reported)
                                                                            });
                                                                        }).catch((reports) => {
                                                                            console.log('reports catch', reports)
                                                                        });
                                                                    }).catch((matches) => {
                                                                        console.log('catch matches', matches);
                                                                    });
                                                                }).catch((liked) => {
                                                                    console.log('likes list CATCH', liked);
                                                                });
                                                            }).catch((age) => {
                                                                checkDb.igotBlockedBy(decoded.id, request.params.id).then((reported) => {
                                                                    if (reported.length === 0) {
                                                                        u.forEach(user => {
                                                                            io.sockets.connected[user.socket].emit('visit', {users: usersSocket, notif: result});
                                                                        });
                                                                    }
                                                                    console.log('age CATCH: ', age);
                                                                    response.render('pages/user', {
                                                                        user: result,
                                                                        usertags: tags,
                                                                        userage: null,
                                                                        userphotos: photos,
                                                                        token
                                                                    });
                                                                }).catch((reported) => {
                                                                    console.log('reports catch', reported)
                                                                });
                                                            });
                                                        }).catch((photos) => {
                                                            checkDb.igotBlockedBy(decoded.id, request.params.id).then((reported) => {
                                                                if (reported.length === 0) {
                                                                    u.forEach(user => {
                                                                        io.sockets.connected[user.socket].emit('visit', {
                                                                            users: usersSocket,
                                                                            notif: result
                                                                        });
                                                                    });
                                                                }
                                                                response.render('pages/user', {
                                                                    user: result,
                                                                    usertags: tags,
                                                                    userage: null,
                                                                    userphotos: null,
                                                                    likes: null,
                                                                    token
                                                                });
                                                            }).catch((reported) => {
                                                                console.log('reports catch', reported)
                                                            });
                                                        });
                                                    }).catch((tags) => {
                                                        checkDb.igotBlockedBy(decoded.id, request.params.id).then((reported) => {
                                                            if (reported.length === 0) {
                                                                u.forEach(user => {
                                                                    io.sockets.connected[user.socket].emit('visit', {
                                                                        users: usersSocket,
                                                                        notif: result
                                                                    });
                                                                });
                                                            }
                                                            response.render('pages/user', {
                                                                user: result,
                                                                usertags: tags,
                                                                userage: null,
                                                                userphotos: photos,
                                                                token
                                                            });
                                                        }).catch((reported) => {
                                                            console.log('reports catch', reported)
                                                        });
                                                    });
                                                }
                                            }).catch((error) => {
                                                console.log('error while updating visits tables', error);
                                            });
                                        }).catch((error) => {
                                            console.log('error updating Notifications', error);
                                        });
                                    }

                                }).catch((result) => {
                                    console.log('catch', result);
                                });
                }
            }).catch((result) => {
                console.log('catch', result);
                request.flash('warning', "Vous n'avez pas le droit d'accèder à cette page sans un profil complet");
                response.redirect('/')
            });
        } catch (e) {
            request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
            return response.render('index');
        }


    }).post(async (request, response) => {

        const token = request.cookies.token;
        try {
        const decoded = jwt.verify(token, 'ratonlaveur', {
            algorithms: ['HS256']
        });

            var u = usersSocket.reduce((acc, elem) => {
                if (elem.id == request.body.userId) {
                    acc.push(elem);
                }
                return acc;
            }, []);
            if (request.body.submit === 'iLiked') {
                if (request.body.userId && request.body.userId != decoded.id && request.body.userId != '' && parseInt(request.body.userId) === parseInt(request.params.id)) {
                    checkDb.updateLikes(decoded.id, parseInt(request.body.userId), 1).then(() => {
                        checkDb.getMatches(decoded.id).then((myMatches) => {
                            checkDb.getUser(decoded.id).then((me) => {
                                checkDb.getMessages(decoded.id, request.body.userId).then((messages) => {
                                    checkDb.igotBlockedBy(decoded.id, request.body.userId).then((reported) => {
                                        if (reported.length === 0) {
                                            u.forEach(user => {
                                                io.sockets.connected[user.socket].emit('likeMatch', {
                                                    users: usersSocket,
                                                    messages,
                                                    like: request.body.userId,
                                                    match: myMatches,
                                                    me
                                                });
                                            });
                                        }
                                        response.json({
                                            flag: '1',
                                            getMatches: myMatches,
                                            messages,
                                            id: parseInt(request.body.userId)
                                        });
                                    }).catch((err) => {
                                        console.log('error while blocking: ', err);
                                    });
                                }).catch((err) => {
                                    console.log('error happened when getting messages: ', err);
                                });
                            }).catch((err) => {
                                console.log('get my info error: ', err);
                            });
                        }).catch((myMatches) => {
                            console.log('err occured: ', myMatches);
                        })
                    }).catch(() => {
                        response.json({flag: '0', id: parseInt(request.body.userId)});
                    })
                }
            } else if (request.body.submit === 'iUnliked') {
                if (request.body.userId && request.body.userId != decoded.id && request.body.userId != '' && parseInt(request.body.userId) === parseInt(request.params.id)) {
                    checkDb.getMatches(decoded.id).then((myMatches) => {
                        checkDb.updateLikes(decoded.id, parseInt(request.body.userId), -1).then(() => {
                            checkDb.getLikes(decoded.id).then((liked) => {
                                checkDb.getUser(decoded.id).then((me) => {
                                    checkDb.getMessages(decoded.id, request.body.userId).then((messages) => {
                                        checkDb.igotBlockedBy(decoded.id, request.body.userId).then((reported) => {
                                            if (reported.length === 0) {
                                                u.forEach(user => {
                                                    io.sockets.connected[user.socket].emit('unlikeMatch', {users: usersSocket, messages, unlike: request.body.userId, unmatch: myMatches, me});
                                                });
                                            }
                                            response.json({flag: '1', theyLikedMe: liked, messages, id: parseInt(request.body.userId)});
                                        }).catch((err) => {
                                            console.log('error while blocking: ', err);
                                        });
                                    }).catch((err) => {
                                        console.log('error happened when getting messages: ', err);
                                    });
                                }).catch((err) => {
                                    console.log('get my info error: ', err);
                                });
                            }).catch((liked) => {
                                console.log('get my likes error: ', liked);
                            });
                        }).catch(() => {
                            response.json({flag: '0', id: parseInt(request.body.userId)});
                        })
                    }).catch((err) => {
                        console.log('an error occured unlike and match: ', err);
                    });
                }
            } else if (request.body.submit === 'iReport') {
                if (request.body.userId && request.body.userId != '' && request.body.userId != decoded.id && parseInt(request.body.userId) === parseInt(request.params.id)) {
                    checkDb.updateReports(decoded.id, parseInt(request.body.userId), 1).then(() => {
                        checkDb.emailReport(decoded.id, request.body.userId).then(() => {
                            response.json({flag: 'reported updated', id: parseInt(request.body.userId)});
                        }).catch((result) => {
                            console.log('An error occured: ', result);
                        });
                    }).catch((result) => {
                        console.log('an error occured: ', result);
                    });
                } else {
                    console.log('ca ne correspond pas')
                }
            } else if (request.body.submit === 'iBlock') {
                if (request.body.userId && request.body.userId != decoded.id && request.body.userId != '' && parseInt(request.body.userId) === parseInt(request.params.id)) {
                    checkDb.updateReports(decoded.id, parseInt(request.body.userId), 2).then(() => {
                        checkDb.getMessages(decoded.id, parseInt(request.body.userId)).then((messages) => {
                            response.json({flag: 'blocked', messages, id: parseInt(request.body.userId)});
                        }).catch((err) => {
                            console.log('error happened when getting messages: ', err);
                        });
                    }).catch((result) => {
                        console.log('an error occured: ', result);
                    });
                }
            } else if (request.body.submit === 'iUnblock') {
                if (request.body.userId && request.body.userId != decoded.id && request.body.userId != '' && parseInt(request.body.userId) === parseInt(request.params.id)) {
                    checkDb.deleteReports(decoded.id, parseInt(request.body.userId)).then(() => {
                        checkDb.getMatches(decoded.id).then((myMatches) => {
                            checkDb.getMessages(decoded.id, parseInt(request.body.userId)).then((messages) => {
                                response.json({flag: 'unblocked', messages, getMatches: myMatches, id: parseInt(request.body.userId)});
                            }).catch((err) => {
                                console.log('error happened when getting messages: ', err);
                            });
                        }).catch((myMatches) => {
                            console.log('err occured: ', myMatches);
                        });
                    }).catch((result) => {
                        console.log('an error occured: ', result);
                    });
                }
            }
        } catch (e) {
            request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
            return response.render('index');
        }
    });

module.exports = router;