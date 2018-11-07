class Profil{
    constructor(){
        this.errors = []
    }

    async userData(name, errorMsg){
        try {
            if (typeof name === 'undefined' || !name || !(name.match(/^[a-zA-Z]+ ?[a-zA-Z]*$/)))
                return await this.errors.push({name, errorMsg});
        } catch (error) {
            return null;
        }
    }

    async userAge(name, errorMsg){
        try {
            if (typeof name === 'undefined' || !name || !(name.match(/^[a-z0-9A-Z_]+$/)))
                return await this.errors.push({name, errorMsg});
        } catch (error) {
            return null;
        }
    }





    
}

module.exports = Profil;