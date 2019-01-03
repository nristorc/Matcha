class RegisterValidation{

    constructor(){
        this.errors = []
    }

    async isName(name, errorMsg, length){
        try {
            if (typeof name === 'undefined' || !name || !(name.match(/^[a-zA-Z]+ ?[\-a-zA-Z]*$/)) || name.length > length)
                return await this.errors.push({name, errorMsg});
        } catch (error) {
            return null;
        }
    }

    async isAlpha(name, errorMsg, length){
        try {
            if (typeof name === 'undefined' || !name || !(name.match(/^[a-z0-9A-Z_]+$/)) || name.length > length)
                return await this.errors.push({name, errorMsg});
        } catch (error) {
            return null;
        }
    }

    async isEmail(name, errorMsg, length){
        try {
            if (typeof name === 'undefined' || !name || !(name.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) || name.length > length)
                return await this.errors.push({name, errorMsg});
        } catch (error) {
            return null;
        }
    }

    async isConfirmed(name, nameConfirm, errorMsg, length){
        try {
            if (typeof name === 'undefined' || !name || !(name.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}$/)) || name !== nameConfirm || name.length > length || nameConfirm.length > length)
                return await this.errors.push({name, nameConfirm, errorMsg});
        } catch (error) {
            return null;
        }
    }

    async matchingRegex(param, regex, msg) {
        try {
            if (!param.match(regex))
                return await this.errors.push({msg});
        } catch (error) {
            return null;
        }
    }
}

module.exports = RegisterValidation;