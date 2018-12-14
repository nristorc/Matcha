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
            const verify = jwt.verify(token, 'ratonlaveur');
        } catch (e) {
            request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
            return response.render('index');
        }
        const decoded = jwt.verify(token, 'ratonlaveur', {
            algorithms: ['HS256']
        });
        callback(null, decoded.id + '-' + Date.now() + path.extname(file.originalname));
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

router.route('/:id')
    .get(async (request, response) => {

        const token = request.cookies.token;
        try {
            const decoded = jwt.verify(token, 'ratonlaveur', {
                algorithms: ['HS256']
            });
            checkDb.profilCompleted(decoded.id).then((result) => {
                if (request.params.id == decoded.id) {
                    response.redirect('/profil');
                } else {
                    const visits = 'INSERT INTO matcha.visits SET visitor_id = ?, visited_id = ?, visited_at = NOW()';
                    checkDb.query(visits, [decoded.id, parseInt(request.params.id, 10)]).then((result) => {
                        if (result) {
                            const sql = 'SELECT * FROM matcha.users WHERE id = ?';
                            checkDb.query(sql, [request.params.id]).then((result) => {
                                if (result == "") {
                                    request.flash('warning', 'Aucun utilisateur ne correspond à votre demande');
                                    response.redirect('/');
                                } else {
                                    checkDb.getTags(request.params.id).then((tags) => {
                                        checkDb.getPhotos(request.params.id).then((photos) => {
                                            userData.userAge(result[0].birth).then((age) => {
                                                checkDb.getLikes(decoded.id).then((liked) => {
                                                    checkDb.getMatches(decoded.id).then((matches) => {
                                                        checkDb.getMyReports(decoded.id).then((reports) => {
                                                            if (photos == '') {
                                                                if (matches == ''){
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
                                                            } else {
                                                                if (matches == ''){
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
                                                                    console.log('il y a des photos et des likes')
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
                                                            }
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
                                                console.log('age CATCH: ', age);
                                                response.render('pages/user', {
                                                    user: result,
                                                    usertags: tags,
                                                    userage: null,
                                                    userphotos: photos,
                                                    token
                                                });
                                            });
                                        }).catch((photos) => {
                                            response.render('pages/user', {
                                                user: result,
                                                usertags: tags,
                                                userage: null,
                                                userphotos: null,
                                                likes: null
                                            });
                                        });
                                    }).catch((tags) => {
                                        response.render('pages/user', {
                                            user: result,
                                            usertags: tags,
                                            userage: null,
                                            userphotos: photos,
                                            token
                                        });
                                    });
                                }

                            }).catch((result) => {
                                console.log('catch', result);
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


    })
    .post(async (request, response) => {
        const token = request.cookies.token;
        try {
            const verify = jwt.verify(token, 'ratonlaveur');
        } catch (e) {
            request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
            return response.render('index');
        }
        const decoded = jwt.verify(token, 'ratonlaveur', {
            algorithms: ['HS256']
        });
        if (request.body.submit === 'iLiked') {
            checkDb.updateLikes(decoded.id, parseInt(request.body.userId), 1).then(() => {
                checkDb.getMatches(decoded.id).then((myMatches) => {
                    response.json({flag: '1', getMatches: myMatches});
                }).catch((myMatches) => {
                    console.log('err occured: ', myMatches);
                })
            }).catch(() => {
                response.json({flag: '0'});
            })
        } else if (request.body.submit === 'iUnliked') {
            checkDb.updateLikes(decoded.id, parseInt(request.body.userId), -1).then(() => {
                checkDb.getLikes(decoded.id).then((liked) => {
                    response.json({flag: '1', theyLikedMe: liked});
                });
            }).catch(() => {
                response.json({flag: '0'});
            })
        } else if (request.body.submit === 'iReport') {
            checkDb.updateReports(decoded.id, parseInt(request.body.userId), 1).then(() => {
                checkDb.emailReport(decoded.id, request.body.userId).then(() => {
                    response.json({flag: 'reported updated'});
                }).catch((result) => {
                    console.log('An error occured: ', result);
                });
            }).catch((result) => {
                console.log('an error occured: ', result);
            });
        } else if (request.body.submit === 'iBlock') {
            checkDb.updateReports(decoded.id, parseInt(request.body.userId), 2).then(() => {
                response.json({flag: 'blocked'});
            }).catch((result) => {
                console.log('an error occured: ', result);
            });
        } else if (request.body.submit === 'iUnblock') {
            checkDb.deleteReports(decoded.id, parseInt(request.body.userId)).then(() => {
                response.json({flag: 'unblocked'});
            }).catch((result) => {
                console.log('an error occured: ', result);
            });
        }
    });

module.exports = router;