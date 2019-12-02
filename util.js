var fs = require('fs');

function restoreOriginalData() {
    fs.writeFileSync('datastore.json', fs.readFileSync('datastore_original.json'));
}

function loadData() {
    return JSON.parse(fs.readFileSync('datastore.json'));
}

function saveData(data) {
  // Data will be stored under a reviews Object
  // This datastore organization isn't very scalable/practical and only used for simplicity
	var obj = {
		reviews: data
	};

	fs.writeFileSync('datastore.json', JSON.stringify(obj));
}

module.exports = {
    restoreOriginalData: restoreOriginalData,
    loadData: loadData,
    saveData: saveData,
}
