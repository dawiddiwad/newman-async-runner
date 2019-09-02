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
			let environments = fs.readdirSync(this.options.folders.environments).filter(function(e){
		        return path.extname(e).toLowerCase() === '.json';
		    });
		    for (let e of environments){
		    	environmentObjects.push(new Environment(this.options.folders.environments + e,
		    		await JSON.parse(fs.readFileSync(this.options.folders.environments + e)).name));
		    }
		    return environmentObjects;
		}	

		annonymizeReportsPassword(){
		    this.removePassword = function(file){
		        fs.readFile(file, 'utf8', function (err, data) {
		        if (err) {
		            return console.log(err);
		        }
		        let result = data.replace(/&lt;n1:password&gt;[^n1:]*/g, '&lt;n1:password&gt;***&lt;/');
		            fs.writeFile(file, result, 'utf8', function (err) {
		                if (err) return console.log(err) 
		                else  console.log('removed password from: ' + file);
		            });
		        });
		}  

		fs.readdirSync(this.options.folders.reports)
		    .filter(function(e){
		        return path.extname(e).toLowerCase() === '.html';
		    })
		    .forEach(file => {
		        this.removePassword(this.options.folders.reports + file);
		    })
		}

		async prepareRunOptions(_collection, _environment, _folder, _data){
			let options = { 
		        collection: _collection.address,
		        environment: _environment.address,
		        folder: _folder,
		        iterationData: this.options.folders.data + _data,
		        reporters: ['cli', 'htmlfull'],
		        reporter : { htmlfull : { 
			            export : this.options.folders.reports 
			            			+ _collection.name + "-" 
			            			+ _environment.name + "-" 
			            			+ _folder 
			            			+ (_data ? "-" + _data : "") 
			            			+ ".html",
			            template : this.options.folders.templates
			            			+this.options.reporter_template
		            }
		        }
		    };
		    if (this.options.specific_collection_items_to_run && !this.options.specific_collection_items_to_run.includes(_folder)) { return; }
		    if (this.options.parallelFolderRuns == false && !this.options.specific_collection_items_to_run) { delete options.folder; }
		    if (!_data) { delete options.iterationData; }

		    this.collectionRuns.push(function (done) {
		    	newman.run(options, done);
			});
		}		

		async setupCollections(){
		    let dataFiles = await fs.readdirSync(this.options.folders.data).filter(function(e){
		        return path.extname(e).toLowerCase() === ('.json' || '.csv')});

		    for (let data of dataFiles.length ? dataFiles : [undefined]){
			    for (let collection of await this.getCollections()){
		    		for (let environment of await this.getEnvironments()){
		    			if (this.options.parallelFolderRuns || this.options.specific_collection_items_to_run){
		    				for (let folder of collection.folders){
		    					await this.prepareRunOptions(collection, environment, folder, data);
		    				}
		    			} else {await this.prepareRunOptions(collection, environment, "all_folders", data);}
		    		}
		    	}	
		    }
			console.log('TOTAL ASYNC RUNS: ' + this.collectionRuns.length + '\n');  
		}

		async runTests(){
		    await this.setupFolders();
		    await this.setupCollections();
		    let self = this;
		    await async.parallel(this.collectionRuns, function (err, results){
		    	self.annonymizeReportsPassword();
		    });
		}		
	}	
};