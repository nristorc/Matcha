class Sort{
    constructor(){
        this.errors = []
    }

    async sort(params){
        return new Promise((resolve, reject) => {
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
            resolve(params)
        });
    }

    async filterCheck(filter, sort){
        return new Promise((resolve, reject) => {
            this.sort(sort).then((sort) => {
                if (filter != undefined){
                    var ageFilter = filter.substring(3, filter.indexOf("pop"));
                    var popFilter = filter.substring(filter.indexOf("pop") + 3, filter.indexOf("loc"));
                    var locFilter = filter.substring(filter.indexOf("loc") + 3, filter.indexOf("tag"));
                    var tagFilter = filter.substring(filter.indexOf("tag") + 3);
                    // console.log("tags:", tagFilter);
                    var ageMin = ageFilter.substring(0, ageFilter.indexOf(","));
                    var ageMax = ageFilter.substring(ageFilter.indexOf(",")+1);
                    if (ageMin == ageMax){
                        ageMin++;
                    }
                    // console.log(`01: date min is ${dateMin}`)
                    // userData.ageConvert(ageMin).then((dateMini) => {
                    //     dateMin = dateMini;
                    //     console.log(`01.1: date min is ${dateMin}`)
                    //     // userData.ageConvert(ageMax).then((dateMaxi) =>)
                    // }).catch(() => {
                    //     dateMin = dateMini;
                    //     console.log(`01.2: date min is ${dateMin}`)
                    // });
                    // userData.ageConvert(ageMax).then((dateMaxi) => {
                    //     dateMax = 0;
                    //     // userData.ageConvert(ageMax).then((dateMaxi) =>)
                    // }).catch(() => {
                    //     dateMax = 0;
                    // });
                    
                    var today = new Date();
                    var dateMin = today.getFullYear() - ageMin + "-" + today.getMonth() + "-" + today.getDate();
                    var dateMax = today.getFullYear() - ageMax + "-" + today.getMonth() + "-" + today.getDate();


                    var dateMin = userData.ageConvert(ageMin);
                    var dateMax = userData.ageConvert(ageMax);       
                    
                    var popMin = popFilter.substring(0, popFilter.indexOf(","));
                    var popMax = popFilter.substring(popFilter.indexOf(",")+1);
                    var locMin = locFilter.substring(0, locFilter.indexOf(","));
                    var locMax = locFilter.substring(locFilter.indexOf(",")+1);
                    filter = " AND `birth` BETWEEN \"" + dateMax + "\" AND \"" + dateMin + 
                    "\" AND `popularity` BETWEEN " + popMin + " AND " + popMax;
                    // + " INNER JOIN matcha.tags ON (`users`.`id` = `tags`.`user_id` AND `tags`.`tag` = \""+ tagFilter + "\")";    
                } else {
                    console.log();
                }
            }).catch((sort) => {

            });
        });

    }

    // tagSearch(params){
    //     var tags = [];
    //     if (params){
    //         // var str = 
    //         tags.push()
    //     }
    // }

    

}

module.exports = Sort;