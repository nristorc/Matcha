class User{
    constructor(){
        this.errors = []
    }

    async userAge(params){
        try {
            return new Promise((resolve, reject) => {
				var dob = params;
				console.log('dob', typeof dob)
				if (dob !== null) {
				    console.log('birthdate from DB/ userAge', typeof dob);
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
				    console.log('dob', dob);
					reject(null);
				}
               });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    async ageConvert(params) {
        try {
            return new Promise((resolve, reject)=> {
                var today = new Date();
                var date = today.getFullYear() - params + "-" + today.getMonth() + "-" + today.getDate();
                resolve(date);
            });
        } catch (error){
            console.log(error);
            return false;            
        }
    }

}

module.exports = User;