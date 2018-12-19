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

router.route('/').get((request, response) => {
    const token = request.cookies.token;
    try {
    const decoded = jwt.verify(token, 'ratonlaveur', {
        algorithms: ['HS256']
    });
    checkDb.getUser(decoded.username).then((user) => {
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
            console.log("update longitude/latitude reussi")
        }).catch(() =>{
            console.log("longitude/latitude ratay")
        });
        console.log("POST", request.body);
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

        await validation.isName(data.firstname, "Mauvais format de prénom");
        await validation.isName(data.lastname, "Mauvais format de nom de Famille");
        await validation.isEmail(data.email, "Mauvais format d'email");
        await validation.isAlpha(data.username, "Mauvais format d'identifiant");
        await validation.matchingRegex(data.birthdate, /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/, "Mauvais format de date de naissance");


        if (data.currentPassword !== '' || data.newPassword !== '' || data.confirmPassword !== '') {
            await checkDb.checkPassword(data, decoded.id).then((result) => {
                if (result === true) {
                    validation.isConfirmed(data.newPassword, data.confirmPassword, "Nouveau mot de passe incorrect");
                }
            }).catch((result) => {
                validation.errors.push(result);
            });
        }

        if (data.username !== decoded.username) {
            const resultUsername  = await checkDb.checkUsername(data.username);
            if (resultUsername[0].count !== 0) {
                validation.errors.push({errorMsg:'Identifiant deja pris'});
            }
        }
        if (data.email !== decoded.email) {
            const resultEmail = await checkDb.checkEmail(data.email);
            if (resultEmail[0].count !== 0) {
                validation.errors.push({errorMsg:'Email deja pris'});
            }
        }

        if (validation.errors.length === 0) {
            if (data.newPassword !== '') {
                checkDb.updateInfoWithPass(data, decoded.id).then(() => {
                    checkDb.query("SELECT * FROM matcha.users WHERE id = ?", [decoded.id]).then((result) => {
                        response.json({user: result[0]});
                        decoded.username = data.username;
                        decoded.email = data.email;

                    }).catch((result) => {
                        console.log('result CATCH:',result);
                    });
                }).catch((result) => {
                    console.log('result CATCH:',result);
                });
            } else if (data.newPassword === '') {
                checkDb.updateInfoWithoutPass(data, decoded.id).then(() => {
                    checkDb.query("SELECT * FROM matcha.users WHERE id = ?", [decoded.id]).then((result) => {
                        response.json({user: result[0]});
                        decoded.username = data.username;
                        decoded.email = data.email;

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
            description: request.body.description,
        };
        await validation.matchingRegex(data.gender, /^Femme|Homme|Homme-Transgenre|Femme-Transgenre$/, "Mauvais format de genre");
        await validation.matchingRegex(data.birthdate, /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/, "Mauvais format de date de naissance");
        await validation.matchingRegex(data.orientation, /^Hétérosexuel|Homosexuel|Bisexuel|Pansexuel$/, "Mauvais format d'orientation");
        await validation.matchingRegex(data.description, /^[a-zA-Z0-9 !.,:;?'"\-_]+$/, "Mauvais format de description");

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
            description: request.body.description,
        };
        await validation.matchingRegex(data.gender, /^Femme|Homme|Homme-Transgenre|Femme-Transgenre$/, "Mauvais format de genre");
        await validation.matchingRegex(data.orientation, /^Hétérosexuel|Homosexuel|Bisexuel|Pansexuel$/, "Mauvais format d'orientation");
        await validation.matchingRegex(data.description, /^[a-zA-Z0-9 !.,:;?'"\-_]+$/, "Mauvais format de description");

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
            const imagePath = request.body.image.substring(22);
            if (result && result.picture) {
                if (result.picture === imagePath) {
                    response.json({message: 'Cette photo est déja votre photo de profil'});
                } else {
                    checkDb.updateProfilPic(imagePath, decoded.id).then((result) => {
                        if (result) {
                            response.json({image: imagePath, message: 'Votre photo de profil a bien été mise à jour'});
                        }
                    }).catch((result) => {
                        response.json({errors: "Une erreur s'est produite: " + result});
                    });
                }
            }
        }).catch((result) => {
            response.json({errors: "Une erreur s'est produite: " + result});
        });

    } else if (request.body.submit === 'deletePic') {

        checkDb.checkProfilPic(decoded.id).then((result) => {
            const imagePath = request.body.image.substring(22);
            if (result && result.picture) {
                if (result.picture === imagePath) {
                    checkDb.updateProfilPic('public/img/avatarDefault.png', decoded.id).then((result) => {
                        if (result) {
                            checkDb.deletePhoto(decoded.id, imagePath).then((deleteRes) => {
                                fs.unlink(imagePath, (err) => {
                                    if (err) throw err;
                                    console.log('successfully deleted ' + imagePath);
                                });
                                response.json({
                                    image: imagePath,
                                    message: 'Votre photo a bien été supprimée',
                                    flag: 'profil'
                                });
                            }).catch((deleteRes) => {
                                response.json({errors: "Une erreur s'est produite: " + deleteRes});
                            });
                        }
                    }).catch((result) => {
                        response.json({errors: "Une erreur s'est produite: " + result});
                    });

                } else {
                    checkDb.deletePhoto(decoded.id, imagePath).then((deleteRes) => {
                        fs.unlink(imagePath, (err) => {
                            if (err) throw err;
                            console.log('successfully deleted ' + imagePath);
                        });
                        response.json({image: imagePath, message: 'Votre photo a bien été supprimée'});
                    }).catch((deleteRes) => {
                        response.json({errors: "Une erreur s'est produite: " + deleteRes});
                    });
                }
            }
        }).catch((result) => {
            response.json({errors: "Une erreur s'est produite: " + result});
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
                            if (result[i].tag === request.body.tag) {
                                flag = true;
                            }
                        }
                        if (flag === true) {
                            response.json({errors: "Vous possédez déjà un tag similaire"});
                        } else {
                            checkDb.insertTag(decoded.id, request.body.tag).then((resTag) => {
                                response.json({message: "Tag added"});
                            }).catch((resTag) => {
                                response.json({errors: "Une erreur s'est produite: " + resTag});
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
                console.log('then', resTag);
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
                response.json({errors: 'Nombre maximum de photos uploadées atteint'});
            } else {
                upload(request, response, (error) => {
                    if (error) {
                        response.json({errors: error.message});
                    } else {
                        if (request.file === undefined) {
                            response.json({errors: 'No file selected !'});
                        }
                        else {
                            checkDb.insertPhoto(decoded.id, request.file.path).then((result) => {
                                if (result) {
                                    checkDb.checkProfilPic(decoded.id).then((resultFlag) => {
                                        if (resultFlag && resultFlag.flag === 0) {
                                            checkDb.updateProfilPic(request.file.path, decoded.id).then((result) => {
                                                response.json({file: request.file.path, flag: resultFlag.flag});
                                            }).catch((result) => {
                                                console.log('result CATCH update: ', result);
                                                response.json({errors: "Une erreur s'est produite, merci de réitérer votre demande ultérieurement // Pb UPDATE"});
                                            });
                                        } else if (resultFlag && resultFlag.flag === 1) {
                                            response.json({file: request.file.path, flag: resultFlag.flag});
                                        }
                                    }).catch((result) => {
                                        console.log('result CATCH checkphoto: ', result);
                                        response.json({errors: "Une erreur s'est produite, merci de réitérer votre demande ultérieurement // Pb CHECK"});
                                    });
                                }
                            }).catch((result) => {
                                console.log('result CATCH insert: ', result);
                                response.json({errors: "Une erreur s'est produite, merci de réitérer votre demande ultérieurement // Pb INSERT"});
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