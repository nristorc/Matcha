class User{
    constructor(){
        this.errors = []
    }

    async userAge(params){
        try {
            return new Promise((resolve, reject) => {
				var dob = params;
				if (dob !== null) {
				    var year = dob.getFullYear();
					var month = dob.getMonth();
					var day = dob.getDate();

					var today = new Date();
					var age = today.getFullYear() - year;
						if (today.getMonth() < month || (today.getMonth() === month && today.getDate() < day)) {
						    age--;
                        }
                    resolve(age);
                } else {
					reject(null);
				}
               });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    // ageConvert(params) {
    //          var today = new Date();
    //             var date = today.getFullYear() - params + "-" + today.getMonth() + "-" + today.getDate();
    //             return(date);
    //         }
	// 	}

// Version Async
    async ageConvert(params) {
        // try {
            return new Promise((resolve, reject) => {
                var today = new Date();
                    var date = today.getFullYear() - params + "-" + today.getMonth() + "-" + today.getDate();
                    console.log(`From age conver, date is : ${date}`)
                    resolve(date);
                });
        // } catch (error){
        //     console.log(error);
        //     reject(error);
        // }
    }


    // getLocation(){
        // https://www.alsacreations.com/tuto/lire/926-geolocalisation-geolocation-html5.html        
    // }
}

module.exports = User;
