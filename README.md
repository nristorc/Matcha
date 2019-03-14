# MATCHA - ECOLE 42

**Projet réalisé dans le cadre de notre formation à l'école 42 - second projet de la branche Web**\
**Objectifs: Micro-framework - Comptes utilisateur avancés - Web temps réel - Géolocalisation - Sécurité / Validation de données**\
**Compétences: Security - Web - DB & Data **

**Credit to: [acoulomb](https://github.com/acoulomb) - [nristorc](https://github.com/nristorc)**

# Technologies utilisées

* Serveur: **NodeJS** - Framework **Express** - **Socket.io**
* Client: **Javascript - Bootstrap**
* Base de données: **MySQL**

## Table des matières
- [Technologies utilisées](#technologies-utilisées)
- [Objectifs](#objectifs)
- [Preview](#preview)
- [Consignes générales](#consignes-générales)
- [Inscription et Connexion](#inscription-et-connexion)
- [Profil de utilisateur](#profil-utilisateur)
- [Matching](#matching)
- [Recherche](#recherche)
- [Profil des autres utilisateurs](#profil-autres-utilisateurs)
- [Chat et Notifications](#chat-et-notifications)
- [Partie bonus](#partie-bonus)

# Objectifs

Ce projet vous propose de créer un site de rencontres.
Vous devrez donc concevoir une application permettant à un utilisateur de s’inscrire et de renseigner ses détails personnels et ses préférences dans l’autre, en vue de pouvoir matcher un autre utilisateur ayant un profil plus ou moins correspondant, parmi une selection de profils d’autres utilisateurs que votre site proposera. Une fois qu’ils se sont réciproquement matchés, ces deux profils devront pouvoir s’échanger des mots doux et plus si affinités via un chat privé que vous aurez conçu.

# Preview
[Vidéo de présentation Matcha](https://drive.google.com/open?id=1oMwi0cKbdhprY3344fR5Qk_erlLGNh7s)

Login Page
![Login Page](https://drive.google.com/uc?id=1PtqC-O9Tgi2Q_lK73CoL2TXVcUOxPAjb)
![Registration](https://drive.google.com/uc?id=1Kw9SjpIsLxMBkcLzqORDRu7Fdn0t6h6I)

Profil de l'utilisateur
![Profil utilisateur](https://drive.google.com/uc?id=1MGMEY5KNr49rs2pHATAomAsJnYEwcQj8)
![Profil](https://drive.google.com/open?id=1bVLmbAwJ_9vqoWeP-fV0gyFm_fFCCJPD)

Map search
![Map](https://drive.google.com/uc?id=1zlza_J8l3VfpWo-z8NxH8YV0WA838c1p)

Profil des autres utilisateurs
![other user](https://drive.google.com/uc?id=1DSVXK5rDKN6L_DBkkaGDms_203v1eZSQ)

Chat Room
![chatroom](https://drive.google.com/uc?id=1ThlP62RPRWbTRw28VMW6Xtz7-9GX1aml)

Notifications
![notifications](https://drive.google.com/uc?id=1IfrJSf_hLsVgogk0xc6m52aoB4DMEONZ)

Historique
![historique](https://drive.google.com/uc?id=1mOp4s_DToZ9T_3oLnexSHo5eMSgS3zVp)

Recherche
![recherche](https://drive.google.com/uc?id=1jRb8ixiZ11JhQvlRE7DDbVCa7Mdp1SO-)

# Consignes générales

* Vous êtes libres d’utiliser le langage de votre choix. Vous pouvez utiliser un microframework ainsi que la majorité des librairies disponibles, tant qu’elles respectent les contraintes détaillées dans le sujet.

* Coté client, vos pages devront utiliser HTML, CSS et JavaScript.

* Vous êtes libres d’utiliser des librairies de conception d’interface utilisateur coté
Front (React, Angular, Vue, Bootstrap, Semantic...)

:warning:Vous devrez utiliser une base de données de type relationnelle ou orienté graphe.
La base de données à utiliser est libre (MySQL, MariaDB, PostgreSQL, Cassandra, InfluxDB, Neo4j...). Vous devrez aussi forger vos requêtes à la main.

:warning:Sauf si vous en êtes l’auteur, votre projet ne doit pas contenir de librairies externes
ou de composants proposant :
   * Un ORM ou un ODM
   * Un validateur de données
   * Une gestion de comptes utilisateurs
   * Une gestion de votre base de données

:iphone:  Votre site devra être présentable sur mobile, et garder une mise en page acceptable
sur de petites résolutions.

# Inscription et Connexion

- L’application doit permettre à un utilisateur de s’inscrire avec:
	- **adresse email**
	- **login**
	- **photo de profil**
	- **nom**
    - **prénom** 
    - **mot de passe**

- :warning: Une fois l’inscription validée, un e-mail de confirmation comportant un
lien unique sera envoyé sur l’adresse e-mail renseignée.
	
- L’utilisateur doit être capable de se connecter avec:
    - **login**
    - **mot de passe** 
- Il doit également pouvoir recevoir un **mail de réinitialisation**
    de son mot de passe en cas d’oubli.
- L’utilisateur doit pouvoir se **déconnecter en un seul clic** depuis n’importe quelle
    page du site.

# Profil de utilisateur

- Une fois connecté, un utilisateur doit pouvoir **compléter son profil**, en rajoutant des
informations telles que :
   - **Son genre**
   - **Son orientation sexuelle**
   - **Une bio courte**
   - **Une liste d’interêts** : sous la forme de tags (ex : #bio, #geek, #piercing)
   - **Des images** : maximum cinq, dont une servant de photo de profil

- L’utilisateur doit pouvoir **Modifier** son **adresse email**, sa **photo de profil**, son **mot de passe** et ses **informations**

- L’utilisateur doit pouvoir consulter les personnes ayant consulté son profil, ainsi que
les personnes qui l’ont **liké**

- L’utilisateur doit avoir un **score de popularité** public

- L’utilisateur doit être **géolocalisé**, à l’arrondissement près. :warning:Si l’utilisateur ne veut pas
être géolocalisé, vous devez trouver un moyen de le géolocaliser malgré lui. L’utilisateur doit pouvoir modifier sa localisation sur son profil.

# Matching

- L’utilisateur doit pouvoir avoir accès à une liste de suggestions qui lui correspondent,
du match total au match plus ou moins partiel.\
:warning:Cette sélection ne sera pas possible tant que le profil étendu de l’utilisateur n’est pas
renseigné. Dans ce cas là, vous devez l’inviter à le remplir.

- Vous ne devez afficher que les profils matchant avec au moins un critère demandé. Vous
devez gérer à minima la bisexualité, qui est considérée comme par défaut si l’orientation
n’est pas renseignée. Vous devez mêler intelligemment les profils par :
   - **L’orientation sexuelle définie**
   - **Leur proximité géographique avec l’utilisateur**
   - **Le rapport de matching par centre d’intérêts**
   - **Leur score de popularité**

- La liste des suggestion devra respecter cet ordre de priorité et devra être **triable par âge**,
**localisation**, **popularité** et **tags en communs**.

:warning:Elle devra aussi être filtrable par **intervalle d’âge**, **localisation**, **intervalle de popularité** et par **tags**. Cette liste de selection n’est accessible que si un profil étendu est renseigné.

# Recherche

- L’utilisateur doit pouvoir effectuer une recherche avancée en sélectionnant un ou plusieurs critères tels que:
   - **Un intervalle d’âge**
   - **Un intervalle de score de popularité**
   - **La localisation**
   - **Un ou plusieurs tags d’interêt**

:warning:Tout comme la liste de suggestion, la liste de résultats devra être triable et filtrable par âge, localisation, popularité et par tags.

# Profil des autres utilisateurs

- Un utilisateur doit pouvoir consulter le profil des autres utilisateurs, qui doit contenir
toutes les informations disponibles sur ce dernier, excepté l’adresse email et le mot de
passe.\
Quand un utilisateur regarde un profil, il doit apparaître dans l’**historique des visites** de ce dernier.

:information_source:L’utilisateur doit également pouvoir :
   - “Liker” ou “unliker” un autre utilisateur, **s'il possède au moins une photo**
   - Voir que le profil visité a déjà “liké” l’utilisateur, et celui ci peut liker en retour
   - Consulter le score de popularité.
   - **Voir si l’utilisateur est en ligne**, et si ce n’est pas le cas, afficher la **date de sa dernière visite**
   - **Reporter l’utilisateur** comme étant un “faux compte”.
   - **Bloquer l’utilisateur**. Un utilisateur bloqué ne doit plus apparaître dans les résultats de recherche, et ne doit plus génerer de notifications.

# Chat et Notifications

- Lorsque deux utilisateurs se sont “likés” mutuellement, on dira qu’ils ont **matchés** et
de ce fait, ils doivent pouvoir **chatter tous les deux en temps réel**.

- L’utilisateur doit pouvoir voir, de n’importe quelle page, qu’il a **recu un nouveau message**, mais vous ferez en sorte que seuls les 2 utilisateurs peuvent interagir dans la même pièce et personne d’autres.

- Un utilisateur doit être **notifié**, **en temps réel** des évènements suivants: 
   - L’utilisateur **a reçu un “like”**
   - L’utilisateur **a reçu une visite**
   - L’utilisateur **a reçu un message**
   - Un utilisateur “liké” **a “liké” en retour**
   - Un utilisateur matché **ne vous “like” plus**

- L’utilisateur doit pouvoir voir, de n’importe quelle page, qu’une notification n’a pas
été lue

# Partie bonus
- Gérer les genres et orientations sexuelles non binaires de manière plus précise **done : transidentité, pansexualité**\
- Ajouter des stratégies OAuth pour la connexion en plus de la votre\
- Charger des images depuis un réseau social\
- Faire une messagerie intégrée accessible à tout moment pendant votre sélection\
- Faire une carte interactive des utilisateurs **done : utilisation google-map-api**

Bonus supplémentaires effectués
- Scroll infini dans la recherche
