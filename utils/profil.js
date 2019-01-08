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
var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyBeGqsazfzYjC4__DuVZ-pB6Hik52ciaNI'
});

const publicIp = require('public-ip');
const ipstack = require('ipstack')

router.route('/').get((request, response) => {
    const token = request.cookies.token;
    try {
        const decoded = jwt.verify(token, 'ratonlaveur', {
            algorithms: ['HS256']
        });

        publicIp.v4().then(ip => {
            checkDb.forceGeo(ip, decoded.id).then((geoloc) => {
                // console.log(geoloc);
            }).catch((err) => {
                console.log(err);
            });
        });

        checkDb.getUser(decoded.id).then((user) => {
            checkDb.getTags(decoded.id).then((tags) => {
                checkDb.getPhotos(decoded.id).then((photos) => {
                    userData.userAge(user[0]['birth']).then((age) => {
                        response.render('pages/profil', {
                            user: user,
                            userage: age,
                            usertags: tags,
                            userphotos: photos,
                            token
                        });
                    }).catch((age) => {
                        response.render('pages/profil', {
                            user: user,
                            usertags: tags,
                            userage: null,
                            userphotos: photos,
                            token
                        });
                    });
                }).catch((photos) => {
                    response.render('pages/profil', {
                        user: user,
                        usertags: tags,
                        userage: null,
                        userphotos: null,
                        token
                    });
                });
            }).catch((tags) => {
                response.render('pages/profil', {
                    user: user,
                    usertags: tags,
                    userage: null,
                    userphotos: photos,
                    token
                });
            });
        }).catch((user) => {
            response.render('index');
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

        if (request.body.latitude && request.body.longitude && request.body.city){
            const sql = "UPDATE matcha.users SET `latitude` = ?, `longitude` = ?, `city` = ?, `changed_loc` = ? WHERE users.id = ?";
            checkDb.query(sql, [request.body.latitude, request.body.longitude, request.body.city, request.body.change, decoded.id]).then(() => {
            }).catch((err) =>{
                console.log(err);
            });
        }

        if (request.body.submit === 'modifyParams') {
            const data = {
                firstname: request.body.firstname,
                lastname: request.body.lastname,
                email: request.body.email,
                username: request.body.username,
                birthdate: request.body.birthdate,
                currentPassword: request.body.currentPassword,
                newPassword: request.body.newPassword,
                confirmPassword: request.body.confirmNewPass
            };

            await validation.isName(data.firstname, "Mauvais format du prénom", 30);
            await validation.isName(data.lastname, "Mauvais format du nom de Famille", 50);
            await validation.isEmail(data.email, "Mauvais format de l'email", 255);
            await validation.isAlpha(data.username, "Mauvais format de l'identifiant", 50);
            await validation.matchingRegex(data.birthdate, /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/, "Mauvais format de la date de naissance");


            if (data.currentPassword !== '' || data.newPassword !== '' || data.confirmPassword !== '') {
                await checkDb.checkPassword(data, decoded.id).then((result) => {
                    if (result === true) {
                        validation.isConfirmed(data.newPassword, data.confirmPassword, "Nouveau mot de passe incorrect", 255);
                    }
                }).catch((result) => {
                    validation.errors.push(result);
                });
            }

            if (data.username !== decoded.username) {
                const resultUsername  = await checkDb.checkUsername(data.username);
                if (resultUsername[0].count !== 0) {
                    validation.errors.push({errorMsg:'Identifiant déjà utilisé'});
                }
            }
            if (data.email !== decoded.email) {
                const resultEmail = await checkDb.checkEmail(data.email);
                if (resultEmail[0].count !== 0) {
                    validation.errors.push({errorMsg:'Email déjà utilisé'});
                }
            }

            if (validation.errors.length === 0) {
                if (data.newPassword !== '') {
                    checkDb.updateInfoWithPass(data, decoded.id).then(() => {
                        checkDb.query("SELECT * FROM matcha.users WHERE id = ?", [decoded.id]).then((result) => {
                            const secret = 'ratonlaveur';
                            const jwtId = Math.random().toString(36).substring(7);
                            var payload = {
                                'id': decoded.id,
                                'username': data.username,
                                'email': data.email,
                                jwtId
                            };

                            jwt.sign(payload, secret, {
                                expiresIn: 3600000
                            }, (err, token) => {
                                if (err) {
                                    console.log('Une erreur est apparue lors de la création du token');
                                    console.log(err);
                                    return false;
                                } else {
                                    if (token != false) {
                                        response.cookie('token', token, {
                                            httpOnly: true,
                                            expiresIn: 9000000
                                        });
                                    }
                                }
                                response.json({user: result[0], token: token});
                            });

                        }).catch((result) => {
                            console.log('result CATCH:',result);
                        });
                    }).catch((result) => {
                        console.log('result CATCH:',result);
                    });
                } else if (data.newPassword === '') {
                    checkDb.updateInfoWithoutPass(data, decoded.id).then(() => {
                        checkDb.query("SELECT * FROM matcha.users WHERE id = ?", [decoded.id]).then((result) => {

                            const secret = 'ratonlaveur';
                            const jwtId = Math.random().toString(36).substring(7);
                            var payload = {
                                'id': decoded.id,
                                'username': data.username,
                                'email': data.email,
                                jwtId
                            };

                            jwt.sign(payload, secret, {
                                expiresIn: 3600000
                            }, (err, token) => {
                                if (err) {
                                    console.log('Une erreur est apparue lors de la création du token');
                                    console.log(err);
                                    return false;
                                } else {
                                    if (token != false) {
                                        response.cookie('token', token, {
                                            httpOnly: true,
                                            expiresIn: 9000000
                                        });
                                    }
                                }
                                response.json({user: result[0], token: token});
                            });

                        }).catch((result) => {
                            console.log('result CATCH:',result);
                        });
                    }).catch((result) => {
                        console.log('result CATCH:',result);
                    });
                }

            } else {
                response.json({errors: validation.errors});
                validation.errors = [];
            }

        } else if (request.body.submit === 'createProfile') {

            const data = {
                gender: request.body.gender,
                birthdate: request.body.birthdate,
                orientation: request.body.orientation,
                description: request.body.description.trim(),
            };
            await validation.matchingRegex(data.gender, /^Femme|Homme|Homme-Transgenre|Femme-Transgenre$/, "Mauvais format du genre");
            await validation.matchingRegex(data.birthdate, /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/, "Mauvais format de la date de naissance");
            await validation.matchingRegex(data.orientation, /^Heterosexuel|Homosexuel|Bisexuel|Pansexuel$/, "Mauvais format de l'orientation");
            await validation.matchingRegex(data.description, /^[a-zA-Z0-9 !.,:;?\n'"\-_]+$/, "Mauvais format de la description");

            if (validation.errors.length === 0) {
                const sql = "UPDATE matcha.users SET `birth` = CASE WHEN ? = '' THEN NULL ELSE str_to_date(?, '%d/%m/%Y') END, `gender` = ?, orientation = ?, description = ? WHERE users.id = ?";

                checkDb.query(sql, [data.birthdate, data.birthdate, data.gender, data.orientation, data.description, decoded.id]).then(() => {
                    checkDb.query("SELECT * FROM matcha.users WHERE id = ?", [decoded.id]).then((result) => {
                        response.json({user: result[0]});

                    }).catch((result) => {
                        console.log('result CATCH:',result);
                    });
                }).catch((result) => {
                    console.log('result CATCH:',result);
                });
            } else {
                response.json({errors: validation.errors});
                validation.errors = [];
            }
        } else if (request.body.submit === 'modifyProfile') {

            const data = {
                gender: request.body.gender,
                orientation: request.body.orientation,
                description: request.body.description.trim(),
            };
            await validation.matchingRegex(data.gender, /^Femme|Homme|Homme-Transgenre|Femme-Transgenre$/, "Mauvais format du genre");
            await validation.matchingRegex(data.orientation, /^Heterosexuel|Homosexuel|Bisexuel|Pansexuel$/, "Mauvais format de l'orientation");
            await validation.matchingRegex(data.description, /^[a-zA-Z0-9 !.,:;?\n'"\-_]+$/, "Mauvais format de la description");

            if (validation.errors.length === 0) {
                const sql = "UPDATE matcha.users SET `gender` = ?, orientation = ?, description = ? WHERE users.id = ?";

                checkDb.query(sql, [data.gender, data.orientation, data.description, decoded.id]).then(() => {
                    checkDb.query("SELECT * FROM matcha.users WHERE id = ?", [decoded.id]).then((result) => {
                        response.json({user: result[0]});

                    }).catch((result) => {
                        console.log('result CATCH:',result);
                    });
                }).catch((result) => {
                    console.log('result CATCH:',result);
                });
            } else {
                response.json({errors: validation.errors});
                validation.errors = [];
            }
        } else if (request.body.submit === 'updateProfilPic') {

            checkDb.checkProfilPic(decoded.id).then((result) => {
                const imagePath = '/'+request.body.image.substring(22);
                console.log('imagepath', imagePath);
                console.log('pic', result.picture);
                if (result && result.picture) {
                    if (result.picture === imagePath) {
                        response.json({message: 'Cette photo est déja votre photo de profil', type: 'warning'});
                    } else {
                        checkDb.updateProfilPic(imagePath, decoded.id).then((result) => {
                            if (result) {
                                response.json({image: imagePath, message: 'Votre photo de profil a bien été mise à jour', type: 'dark'});
                            }
                        }).catch((result) => {
                            response.json({errors: "Une erreur s'est produite: " + result, type: 'warning'});
                        });
                    }
                }
            }).catch((result) => {
                response.json({errors: "Une erreur s'est produite: " + result, type: 'warning'});
            });

        } else if (request.body.submit === 'deletePic') {

            checkDb.getPhotos(decoded.id).then((result2) => {
                if (result2 && result2 != '') {
                    const imagePath = '/'+request.body.image.substring(22);
                    for (var i = 0; i < result2.length; i++) {
                        if (result2[i].photo === imagePath) {
                            checkDb.checkProfilPic(decoded.id).then((result) => {
                                const imagePath = '/'+request.body.image.substring(22);
                                if (result && result.picture) {
                                    if (result.picture === imagePath) {
                                        checkDb.updateProfilPic('/public/img/avatarDefault.png', decoded.id).then((result) => {
                                            if (result) {
                                                checkDb.deletePhoto(decoded.id, imagePath).then((deleteRes) => {
                                                    fs.unlink(request.body.image.substring(22), (err) => {
                                                        if (err) throw err;
                                                    });
                                                    response.json({
                                                        image: imagePath,
                                                        message: 'Votre photo a bien été supprimée',
                                                        flag: 'profil',
                                                        type: 'dark'
                                                    });
                                                    return ;
                                                }).catch((deleteRes) => {
                                                    response.json({errors: "Une erreur s'est produite: " + deleteRes, type: 'warning'});
                                                });
                                            }
                                        }).catch((result) => {
                                            response.json({errors: "Une erreur s'est produite: " + result, type: 'warning'});
                                        });

                                    } else {
                                        checkDb.deletePhoto(decoded.id, imagePath).then((deleteRes) => {
                                            fs.unlink(request.body.image.substring(22), (err) => {
                                                if (err) throw err;
                                            });
                                            response.json({image: imagePath, message: 'Votre photo a bien été supprimée', type: 'dark'});
                                            return ;
                                        }).catch((deleteRes) => {
                                            response.json({errors: "Une erreur s'est produite: " + deleteRes, type: 'warning'});
                                        });
                                    }
                                }
                            }).catch((result) => {
                                response.json({errors: "Une erreur s'est produite: " + result, type: 'warning'});
                            });
                        }
                    }
                }
            }).catch((err) => {
                console.log('catch', err)
            });

        } else if (request.body.submit === 'addTag') {
            if (request.body.tag) {
                checkDb.getTags(decoded.id).then((result) => {
                    if (result) {
                        if (result.length >= 6){
                            response.json({errors: "Vous avez atteint le nombre maximum de tags autorisé"});
                        } else {
                            var flag = false;
                            for (var i = 0; i < result.length; i++) {
                                if (result[i].tag === request.body.tag.toLowerCase()) {
                                    flag = true;
                                }
                            }
                            if (flag === true) {
                                response.json({errors: "Vous possédez déjà un tag similaire"});
                            } else {
                                checkDb.insertTag(decoded.id, request.body.tag, 255).then(() => {
                                    response.json({message: "Tag added"});
                                }).catch((resTag) => {
                                    response.json({errors: resTag});
                                })
                            }
                        }
                    }
                }).catch((result) => {
                    response.json({errors: "Une erreur s'est produite: " + result});
                });
            }
        } else if(request.body.submit === 'deleteTag') {
            if (request.body.tag) {
                checkDb.deleteTag(decoded.id, request.body.tag).then((resTag) => {
                    response.json({message: "Tag deleted"});
                }).catch((resTag) => {
                    console.log('catch', resTag);
                    response.json({errors: "Une erreur s'est produite: " + resTag});
                })
            }
        }
        else {
            fs.readdir('public/uploads/', (err, items) => {
                var i = 0;
                while (items[i] && items[i].split('-')[0] == decoded.id) {
                    i++;
                }
                if (i >= 5) {
                    response.json({errors: 'Nombre maximum de photos uploadées atteint', type: 'warning'});
                } else {
                    upload(request, response, (error) => {
                        if (error) {
                            response.json({errors: error.message, type: 'warning'});
                        } else {
                            if (request.file === undefined) {
                                response.json({errors: 'Aucun fichier sélectionné', type: 'warning'});
                            }
                            else {
                                checkDb.insertPhoto(decoded.id, '/'+request.file.path).then((result) => {
                                    if (result) {
                                        checkDb.checkProfilPic(decoded.id).then((resultFlag) => {
                                            if (resultFlag && resultFlag.flag === 0) {
                                                checkDb.updateProfilPic('/'+request.file.path, decoded.id).then((result) => {
                                                    response.json({file: '/'+request.file.path, flag: resultFlag.flag, type: 'dark'});
                                                }).catch((result) => {
                                                    console.log('result CATCH update: ', result);
                                                    response.json({errors: "Une erreur s'est produite, merci de réitérer votre demande ultérieurement", type: 'warning'});
                                                });
                                            } else if (resultFlag && resultFlag.flag === 1) {
                                                response.json({file: '/'+request.file.path, flag: resultFlag.flag, type: 'dark'});
                                            }
                                        }).catch((result) => {
                                            console.log('result CATCH checkphoto: ', result);
                                            response.json({errors: "Une erreur s'est produite, merci de réitérer votre demande ultérieurement", type: 'warning'});
                                        });
                                    }
                                }).catch((result) => {
                                    console.log('result CATCH insert: ', result);
                                    response.json({errors: "Une erreur s'est produite, merci de réitérer votre demande ultérieurement"});
                                });
                            }
                        }
                    });
                }
            });
        }
    } catch (e) {
        request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
        return response.render('index');
    }
});

module.exports = router;