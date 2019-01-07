class Sort{
    constructor(){
        this.errors = []
    }

    async searchParamsCheck(filter, sort, user_position){
        return new Promise((resolve, reject) => {
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
				if (filter.indexOf("age") == -1  || filter.indexOf("pop") == -1 || filter.indexOf("loc") == -1 || filter.indexOf("tag") == -1)  {
					reject();
				}
				var ageFilter = filter.substring(3, filter.indexOf("pop"));
				var popFilter = filter.substring(filter.indexOf("pop") + 3, filter.indexOf("loc"));
				var locFilter = filter.substring(filter.indexOf("loc") + 3, filter.indexOf("tag"));
				var tagFilter = filter.substring(filter.indexOf("tag") + 3);
				var ageMin = parseInt(ageFilter.substring(0, ageFilter.indexOf(",")));
				var ageMax = parseInt(ageFilter.substring(ageFilter.indexOf(",")+1));
				var tmp;
				if (ageMin == ageMax){
					ageMin++;
				}
				if (ageMin > ageMax){
					tmp = ageMin; 
					ageMin = ageMax;
					ageMax = tmp;
				}
				var today = new Date();
				var dateMin = today.getFullYear() - ageMin + "-" + today.getMonth() + 1 + "-" + today.getDate();
				var dateMax = today.getFullYear() - ageMax + "-" + today.getMonth() + 1 + "-" + today.getDate();
				var popMin = parseInt(popFilter.substring(0, popFilter.indexOf(",")));
				var popMax = parseInt(popFilter.substring(popFilter.indexOf(",")+1));
				var locMin = parseInt(locFilter.substring(0, locFilter.indexOf(",")));
				var locMax = parseInt(locFilter.substring(locFilter.indexOf(",")+1));
				if (popMin > popMax){
					tmp = popMin; 
					popMin = popMax;
					popMax = tmp;
				}
				if (locMin > locMax){
					tmp = locMin; 
					locMin = locMax;
					locMax = tmp;
				}
				if (ageMin < 18) {
					ageMin = 18;
				}
				if (ageMax < 18){
					ageMax = 18;
				}
				if (ageMin > 99) {
					ageMin = 99;
				}
				if (ageMax > 99){
					ageMax = 99;
				}
				if (popMin < -100) {
					popMin = -100;
				}
				if (popMax < -100){
					popMax = -100;
				}
				if (popMin > 100) {
					popMin = 100;
				}
				if (popMax > 100){
					popMax = 100;
				}
				if (locMin < 0) {
					locMin = 0;
				}
				if (locMax < 0){
					locMax = 0;
				}
				if (locMin > 100) {
					locMin = 100;
				}
				if (locMax > 100){
					locMax = 100;
				}
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