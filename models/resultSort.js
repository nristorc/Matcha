class Sort{
    constructor(){
        this.errors = []
    }

    sort(params){
        if (params == "popAsc"){
            params = " ORDER by `popularity` ASC";
        } else if (params == "popDesc"){
            params = " ORDER by `popularity` DESC";
        } else if (params == "ageAsc"){
            params = " ORDER by `birth` ASC";
        } else if (params == "ageDesc"){
            params = " ORDER by `birth` DESC";
        } else if (params == "loc"){
            params = " ORDER by `birth` DESC";
        }
        return(params)
    }
    
}

module.exports = Sort;