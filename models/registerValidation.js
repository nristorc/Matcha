class RegisterValidation{

    constructor(){
        this.errors = []
    }

    async isName(name, errorMsg){
        try {
            if (typeof name === 'undefined' || !name || !(name.match(/^[a-zA-Z]+ ?[a-zA-Z]*$/)))
                this.errors.push({name, errorMsg});
        } catch (error) {
            console.log(error);
            return null;
        }
    }

}

module.exports = RegisterValidation;