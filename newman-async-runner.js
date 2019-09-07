class Collection{
	constructor(address, content, name){
		this.address = address;
		this.content = content;
		this.name = name;
		this.folders = new Array();
	}
}

class Environment{
	constructor(address, name){
		this.address = address;
		this.name = name;
	}
}

module.exports = {
	path: path = require('path'),
	fs: fs = require('fs'),
	async: async = require('async'),
	newman: newman = require('newman'),

	NewmanRunner: class NewmanRunner{
		constructor(options){
			this.collectionRuns = new Array();
			this.options = options;
		}

		async setupFolders(){
			for (let f in this.options.folders){
				await fs.mkdirSync(this.options.folders[f], {recursive: true})
				console.log('checking folder: ' + f);
			}
		}

		async getCollections(){
			let collectionObjects = new Array();
			let colections = await fs.readdirSync(this.options.folders.collections).filter(function(e){
				return path.extname(e).toLowerCase() === '.json';
			});
			for (let c of colections){
				let collection = await JSON.parse(fs.readFileSync(this.options.folders.collections + c));
				let collectionObject = new Collection(this.options.folders.collections + c, collection, collection.info.name);
				for (let folder of collection.item){
					collectionObject.folders.push(folder.name);
				}
				collectionObjects.push(collectionObject);
			}
			return collectionObjects;
		}

		async getEnvironments(){
			let environmentObjects = new Array();
			if (this.options.folders.environments){
				let environments = fs.readdirSync(this.options.folders.environments).filter(function(e){
					return path.extname(e).toLowerCase() === '.json';
				});
				for (let e of environments){
					environmentObjects.push(new Environment(this.options.folders.environments + e,
						await JSON.parse(fs.readFileSync(this.options.folders.environments + e)).name));
				}
			}
			return environmentObjects.length ? environmentObjects : [undefined];
		}
		
		async getFiles() {
			let files = await fs.readdirSync(this.options.folders.data).filter(function (e) {
				return path.extname(e).toLowerCase() === '.json' || path.extname(e).toLowerCase() === '.csv';
			});
			return files.length ? files : [undefined];
		}

		async anonymizeReportsPassword(){
			this.removePassword = async function(file){
				if(!this.options.anonymizeFilter){
				}
				let result = await fs.readFileSync(file, 'utf8');
				let anonymizeFilter = /(?<=&lt;n1:password&gt;)(.*?)(?=&lt;\/n1:password&gt;)/g;
				if(this.options.anonymizeFilter != 'rebelia'){
					anonymizeFilter = this.options.anonymizeFilter;
				}
				result = result.replace(anonymizeFilter, '***');
					await fs.writeFileSync(file, result, 'utf8')
					console.log('anonymized report: ' + file);
				}

			try{
				let readFiles = await fs.readdirSync(this.options.folders.reports);
				readFiles.filter(function(e){
						return path.extname(e).toLowerCase() === '.html';
					})
					.forEach(file => {
						this.removePassword(this.options.folders.reports + file);
					})
			} catch {console.log('could not open reports folder, reports were not anonymized')}
		}

		prepareRunOptions(_collection, _environment, _folder, _data){
			let options = {
				collection: _collection.address,
				environment: (_environment ? _environment.address : undefined),
				folder: _folder,
				iterationData: this.options.folders.data + _data,
				reporters: ['cli', 'htmlfull'],
				reporter : { htmlfull : {
						export : (this.options.folders.reports ? this.options.folders.reports : "")
									+ _collection.name + "-"
									+ (_environment ? _environment.name + "-" : "")
									+ _folder 
									+ (_data ? "-" + _data.match(/(.*)(?=\.json|.csv)/gi)[0] : "")
									+ ".html",
						template : this.options.folders.templates
									+ this.options.reporter_template
					}
				}
			};
			if (this.options.specific_collection_items_to_run && !this.options.specific_collection_items_to_run.includes(_folder)){ 
				return;
			}
			if (this.options.parallelFolderRuns == false && !this.options.specific_collection_items_to_run){
				delete options.folder;
			}
			if (!this.options.reporter_template){
				delete options.reporter.htmlfull.template;
			}
			if (!_data){
				delete options.iterationData;
			}
			if (!_environment){
				delete options.environment
			}

			this.collectionRuns.push(function (done) {
				newman.run(options, done);
			});
		}

		async setupCollections(){
			for (let data of await this.getFiles()){
				for (let collection of await this.getCollections()){
					for (let environment of await this.getEnvironments()){
						if (this.options.parallelFolderRuns || this.options.specific_collection_items_to_run){
							for (let folder of collection.folders){
								this.prepareRunOptions(collection, environment, folder, data);
							}
						} else {this.prepareRunOptions(collection, environment, "all_folders", data);}
					}
				}
			}
			console.log('TOTAL ASYNC RUNS: ' + this.collectionRuns.length + '\n');
		}

		async runTests(){
			await this.setupFolders();
			await this.setupCollections();
			let self = this;
			async.parallel(this.collectionRuns, function (err, results) {
				self.anonymizeReportsPassword();
			});
		}
	}
};