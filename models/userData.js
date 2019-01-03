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


    async ageConvert(params) {
        return new Promise((resolve, reject) => {
            var today = new Date(); 
                var date = today.getFullYear() - params + "-" + today.getMonth() + 1 + "-" + today.getDate();
                resolve(date);
        });
    }
}

module.exports = User;
