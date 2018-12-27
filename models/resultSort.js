class Sort{
    constructor(){
        this.errors = []
    }

    // async getSort(params){
    //     return new Promise((resolve, reject) => {
    //         if (params == "popAsc"){
    //             params = " ORDER by `popularity` ASC";
    //      } else if (params == "popDesc"){
    //             params = " ORDER by `popularity` DESC";
    //         } else if (params == "ageAsc"){
    //             params = " ORDER by `birth` ASC";
    //         } else if (params == "ageDesc"){
    //             params = " ORDER by `birth` DESC";
    //         } else if (params == "loc"){
    //             params = " ORDER by `birth` DESC";
    //         }
    //         resolve(params)
    //     });
    // }

    // async getTag(tags){
    //     return new Promise((resolve, reject) => {
	// 		var tags = tags.split('-');
	// 		var req = " INNER JOIN matcha.tags ON (`users`.`id` = `tags`.`user_id`";
	// 		for (var i=0; i < tags.length; i++){
	// 			req = req.concat(" AND `tags`.`tag` = " + tags[i]);
	// 		}
	// 		req = req.concat(")");
    //         resolve({req, tags})
    //     });
	// }

    async searchParamsCheck(filter, sort, user_position){
        return new Promise((resolve, reject) => {
			// console.log("user_position.latitude", user_position[0].latitude);
			// console.log("user_position.longitude", user_position[0].longitude);
			var reqSort;
			var reqFilter;
			var reqTag;
			if (sort != undefined){
				if (sort == "popAsc"){
					reqSort = "`popularity` ASC";
			 	} else if (sort == "popDesc"){
					reqSort = "`popularity` DESC";
				} else if (sort == "ageAsc"){
					reqSort = "`birth` ASC";
				} else if (sort == "ageDesc"){
					reqSort = "`birth` DESC";
				} else if (sort == "loc"){
					reqSort = "`loc` ASC";
				} else if (sort == "tag"){
					reqSort = "tag";
				} else {
					reqSort = "";
				}
			} else {
				reqSort = "";
			}
			if (filter != undefined){
				var ageFilter = filter.substring(3, filter.indexOf("pop"));
				var popFilter = filter.substring(filter.indexOf("pop") + 3, filter.indexOf("loc"));
				var locFilter = filter.substring(filter.indexOf("loc") + 3, filter.indexOf("tag"));
				var tagFilter = filter.substring(filter.indexOf("tag") + 3);
				var ageMin = ageFilter.substring(0, ageFilter.indexOf(","));
				var ageMax = ageFilter.substring(ageFilter.indexOf(",")+1);
				if (ageMin == ageMax){
					ageMin++;
				}
				var today = new Date();
				var dateMin = today.getFullYear() - ageMin + "-" + today.getMonth() + "-" + today.getDate();
				var dateMax = today.getFullYear() - ageMax + "-" + today.getMonth() + "-" + today.getDate();
				var popMin = popFilter.substring(0, popFilter.indexOf(","));
				var popMax = popFilter.substring(popFilter.indexOf(",")+1);
				var locMin = locFilter.substring(0, locFilter.indexOf(","));
				var locMax = locFilter.substring(locFilter.indexOf(",")+1);
				if (locMax == 100){
					reqFilter = " AND `birth` BETWEEN \"" + dateMax + "\" AND \"" + dateMin + 
					"\" AND `popularity` BETWEEN " + popMin + " AND " + popMax +
					" AND (6371 * ACOS(COS(RADIANS(" + user_position[0].latitude + ")) * COS(RADIANS(`users`.`latitude`)) * COS(RADIANS(`users`.`longitude`) - RADIANS("+user_position[0].longitude+")) + SIN(RADIANS("+user_position[0].latitude+")) * SIN(RADIANS(`users`.`latitude`))) > " + locMin + ")";
				} else {
					reqFilter = " AND `birth` BETWEEN \"" + dateMax + "\" AND \"" + dateMin + 
					"\" AND `popularity` BETWEEN " + popMin + " AND " + popMax +
					" AND (6371 * ACOS(COS(RADIANS(" + user_position[0].latitude + ")) * COS(RADIANS(`users`.`latitude`)) * COS(RADIANS(`users`.`longitude`) - RADIANS("+user_position[0].longitude+")) + SIN(RADIANS("+user_position[0].latitude+")) * SIN(RADIANS(`users`.`latitude`))) BETWEEN " + locMin + " AND " + locMax + ")";
				}
				if (tagFilter != ""){
					tagFilter = tagFilter.split(',');
					reqTag = " INNER JOIN matcha.tags ON `users`.`id` = `tags`.`user_id`";
					for (var a=0; a < tagFilter.length; a++){
						for (var x=0; x < tagFilter.length; x++){
							if (a != x && tagFilter[a] == tagFilter[x]){
								tagFilter.splice(a, 1);
							}
						}
					}
					for (var i=0; i < tagFilter.length; i++){
						if (i == 0){
							reqTag = reqTag.concat(" WHERE (`tags`.`tag` = \"" + tagFilter[i] + "\"");
						} else if (i < 6) {
							reqTag = reqTag.concat(" OR `tags`.`tag` = \"" + tagFilter[i] + "\"");
						}
					}
					reqTag = reqTag.concat(") ");
				} else {
					reqTag = "";
				}
			} else {
				reqFilter = "";
				reqTag = "";
			}
			resolve({reqSort, reqFilter, reqTag});
        });
	}
}

module.exports = Sort;